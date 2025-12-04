const router = require('express').Router();
const User = require('../models/User');
const { auth, authorize, orgAdmin, hrAdmin } = require('../middleware/auth');

// GET all users (filtered by org for non-platform admins)
router.get('/', auth, hrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;
    const query = {};
    
    // Non-platform admins can only see their org's users
    if (req.user.role !== 'PLATFORM_ADMIN') {
      query.orgId = req.user.orgId;
    } else if (req.query.orgId) {
      query.orgId = req.query.orgId;
    }
    
    if (search) query.email = { $regex: search, $options: 'i' };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const users = await User.find(query)
      .select('-securityQuestions')
      .populate('orgId', 'name')
      .populate('employeeId', 'personal.firstName personal.lastName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({ users, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-securityQuestions -password')
      .populate('orgId', 'name')
      .populate('employeeId');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Access control
    if (req.user.role !== 'PLATFORM_ADMIN' && 
        req.user.orgId?.toString() !== user.orgId?.toString() &&
        req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create user
router.post('/', auth, hrAdmin, async (req, res) => {
  try {
    const { email, password, role, orgId } = req.body;
    
    // Check role hierarchy
    if (!req.user.canCreateRole(role)) {
      return res.status(403).json({ message: `Cannot create ${role} user with your role` });
    }
    
    // Non-platform admins can only create users in their org
    const targetOrgId = req.user.role === 'PLATFORM_ADMIN' ? orgId : req.user.orgId;
    
    if (!targetOrgId && role !== 'PLATFORM_ADMIN') {
      return res.status(400).json({ message: 'Organization ID required' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const user = new User({
      email,
      password,
      role,
      orgId: targetOrgId,
    });
    await user.save();
    
    res.status(201).json({ message: 'User created', user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Access control
    const isSelf = req.user._id.toString() === user._id.toString();
    const isSameOrg = req.user.orgId?.toString() === user.orgId?.toString();
    const isPlatformAdmin = req.user.role === 'PLATFORM_ADMIN';
    const isOrgAdmin = req.user.role === 'ORG_ADMIN';
    
    if (!isPlatformAdmin && !isSelf && !(isOrgAdmin && isSameOrg)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { email, role, isActive } = req.body;
    
    // Role change - check hierarchy
    if (role && role !== user.role) {
      if (!req.user.canCreateRole(role)) {
        return res.status(403).json({ message: `Cannot assign ${role} with your role` });
      }
      user.role = role;
    }
    
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already exists' });
      user.email = email;
    }
    
    if (isActive !== undefined && (isPlatformAdmin || isOrgAdmin)) {
      user.isActive = isActive;
    }
    
    await user.save();
    
    res.json({ message: 'User updated', user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH toggle user status
router.patch('/:id/toggle-status', auth, orgAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Access control
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== user.orgId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Cannot deactivate yourself
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }
    
    user.isActive = !user.isActive;
    if (!user.isActive) user.tokenVersion += 1; // Logout user
    await user.save();
    
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Admin reset user password
router.post('/:id/reset-password', auth, orgAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Access control
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== user.orgId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    user.password = newPassword;
    user.isFirstLogin = true;
    user.tokenVersion += 1;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user (soft delete)
router.delete('/:id', auth, orgAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Access control
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== user.orgId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Cannot delete yourself
    if (req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    
    user.isActive = false;
    user.tokenVersion += 1;
    await user.save();
    
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
