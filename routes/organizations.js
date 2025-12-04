const router = require('express').Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const { auth, platformAdmin, orgAdmin } = require('../middleware/auth');

// GET all organizations (Platform Admin only)
router.get('/', auth, platformAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const query = {};
    
    if (search) query.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const orgs = await Organization.find(query)
      .select('name logo contact isActive setupComplete createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Organization.countDocuments(query);
    
    res.json({ organizations: orgs, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single organization
router.get('/:id', auth, async (req, res) => {
  try {
    // Non-platform admins can only view their own org
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    res.json(org);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create organization (Platform Admin only)
router.post('/', auth, platformAdmin, async (req, res) => {
  try {
    const { name, contact, address } = req.body;
    
    const org = new Organization({ name, contact, address });
    await org.save();
    
    res.status(201).json({ message: 'Organization created', organization: org });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update organization
router.put('/:id', auth, orgAdmin, async (req, res) => {
  try {
    // Non-platform admins can only update their own org
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const updates = req.body;
    delete updates._id; // Prevent _id modification
    
    const org = await Organization.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    res.json({ message: 'Organization updated', organization: org });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Setup Wizard - Step by step
router.put('/:id/setup/:step', auth, orgAdmin, async (req, res) => {
  try {
    if (req.user.role !== 'PLATFORM_ADMIN' && req.user.orgId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { step } = req.params;
    const stepNum = parseInt(step);
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    switch (stepNum) {
      case 1: // Company Info
        Object.assign(org, {
          name: req.body.name || org.name,
          logo: req.body.logo || org.logo,
          address: { ...org.address, ...req.body.address },
          contact: { ...org.contact, ...req.body.contact },
          statutory: { ...org.statutory, ...req.body.statutory },
        });
        break;
        
      case 2: // Feature Toggles
        org.features = { ...org.features, ...req.body.features };
        break;
        
      case 3: // Attendance Config
        org.attendanceConfig = { ...org.attendanceConfig, ...req.body.attendanceConfig };
        break;
        
      case 4: // Leave Config
        if (req.body.leaveTypes) org.leaveConfig.types = req.body.leaveTypes;
        if (req.body.workingDays) org.leaveConfig.workingDays = req.body.workingDays;
        break;
        
      case 5: // Salary Config
        org.salaryConfig = { ...org.salaryConfig, ...req.body.salaryConfig };
        break;
        
      case 6: // Create First HR Admin
        const { email, password, firstName, lastName } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });
        
        const hrAdmin = new User({
          email,
          password,
          role: 'HR_ADMIN',
          orgId: org._id,
        });
        await hrAdmin.save();
        
        org.setupComplete = true;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid setup step' });
    }
    
    org.setupStep = stepNum;
    await org.save();
    
    res.json({ 
      message: `Step ${stepNum} completed`, 
      organization: org,
      setupComplete: org.setupComplete 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Create Org Admin (Platform Admin only)
router.post('/:id/admin', auth, platformAdmin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });
    
    const orgAdmin = new User({
      email,
      password,
      role: 'ORG_ADMIN',
      orgId: org._id,
    });
    await orgAdmin.save();
    
    res.status(201).json({ message: 'Organization Admin created', userId: orgAdmin._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH toggle organization active status
router.patch('/:id/toggle-status', auth, platformAdmin, async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    org.isActive = !org.isActive;
    await org.save();
    
    // Also deactivate all users if org is deactivated
    if (!org.isActive) {
      await User.updateMany({ orgId: org._id }, { isActive: false });
    }
    
    res.json({ message: `Organization ${org.isActive ? 'activated' : 'deactivated'}`, isActive: org.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE organization (soft delete)
router.delete('/:id', auth, platformAdmin, async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    
    // Deactivate all users
    await User.updateMany({ orgId: org._id }, { isActive: false });
    
    res.json({ message: 'Organization deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
