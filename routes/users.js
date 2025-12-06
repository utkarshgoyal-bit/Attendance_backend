const router = require('express').Router();
const User = require('../models/User');
const { auth, platformAdmin, orgAdmin, hrAdmin } = require('../middleware/auth');

// GET all users
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    
    // Platform admin can see all, others only their org
    if (req.user.role !== 'PLATFORM_ADMIN') {
      query.orgId = req.orgId;
    }
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password')
      .populate('orgId', 'name')
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
    const user = await User.findById(req.params.id).select('-password').populate('orgId', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Users can only view users in their org (except platform admin)
    if (req.user.role !== 'PLATFORM_ADMIN' && user.orgId?.toString() !== req.orgId?.toString()) {
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
    const { email, password, role } = req.body;
    
    // Check if user can create this role
    if (!req.user.canCreateRole(role)) {
      return res.status(403).json({ message: `You cannot create users with role: ${role}` });
    }
    
    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create user
    const user = new User({
      email,
      password: password || 'Welcome@123',
      role,
      orgId: req.user.role === 'PLATFORM_ADMIN' ? req.body.orgId : req.orgId,
      isFirstLogin: true,
    });
    
    await user.save();
    
    // Return without password
    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(201).json({ message: 'User created', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user
router.put('/:id', auth, hrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check permissions
    if (req.user.role !== 'PLATFORM_ADMIN' && user.orgId?.toString() !== req.orgId?.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { email, role } = req.body;
    
    // Check if can create/update to this role
    if (role && !req.user.canCreateRole(role)) {
      return res.status(403).json({ message: `You cannot set role: ${role}` });
    }
    
    // Update fields
    if (email) user.email = email;
    if (role) user.role = role;
    
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ message: 'User updated', user: userObj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH toggle user status
router.patch('/:id/toggle-status', auth, hrAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Can't deactivate self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST reset password (admin only)
router.post('/:id/reset-password', auth, hrAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.password = newPassword;
    user.isFirstLogin = true;
    user.tokenVersion += 1; // Logout user from all devices
    await user.save();
    
    res.json({ message: 'Password reset successfully. User will be required to change it on next login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;