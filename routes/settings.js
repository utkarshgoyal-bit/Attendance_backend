const router = require('express').Router();
const { Department, Branch, Shift, CustomField } = require('../models/OrgModels');
const { auth, orgAdmin, hrAdmin } = require('../middleware/auth');

// ============ DEPARTMENTS ============
router.get('/departments', auth, async (req, res) => {
  try {
    const depts = await Department.find({ orgId: req.orgId, isActive: true })
      .populate('head', 'personal.firstName personal.lastName eId')
      .sort('name');
    res.json(depts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/departments', auth, hrAdmin, async (req, res) => {
  try {
    const dept = new Department({ orgId: req.orgId, ...req.body });
    await dept.save();
    res.status(201).json(dept);
  } catch (err) { 
    if (err.code === 11000) return res.status(400).json({ message: 'Department already exists' });
    res.status(500).json({ message: err.message }); 
  }
});

router.put('/departments/:id', auth, hrAdmin, async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      req.body,
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/departments/:id', auth, hrAdmin, async (req, res) => {
  try {
    await Department.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { isActive: false }
    );
    res.json({ message: 'Department deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ============ BRANCHES ============
router.get('/branches', auth, async (req, res) => {
  try {
    const branches = await Branch.find({ orgId: req.orgId, isActive: true }).sort('name');
    res.json(branches);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/branches', auth, orgAdmin, async (req, res) => {
  try {
    const branch = new Branch({ orgId: req.orgId, ...req.body });
    await branch.save();
    res.status(201).json(branch);
  } catch (err) { 
    if (err.code === 11000) return res.status(400).json({ message: 'Branch already exists' });
    res.status(500).json({ message: err.message }); 
  }
});

router.put('/branches/:id', auth, orgAdmin, async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      req.body,
      { new: true }
    );
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/branches/:id', auth, orgAdmin, async (req, res) => {
  try {
    await Branch.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { isActive: false }
    );
    res.json({ message: 'Branch deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ============ SHIFTS ============
router.get('/shifts', auth, async (req, res) => {
  try {
    const shifts = await Shift.find({ orgId: req.orgId, isActive: true }).sort('name');
    res.json(shifts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/shifts', auth, orgAdmin, async (req, res) => {
  try {
    // If setting as default, unset others
    if (req.body.isDefault) {
      await Shift.updateMany({ orgId: req.orgId }, { isDefault: false });
    }
    const shift = new Shift({ orgId: req.orgId, ...req.body });
    await shift.save();
    res.status(201).json(shift);
  } catch (err) { 
    if (err.code === 11000) return res.status(400).json({ message: 'Shift already exists' });
    res.status(500).json({ message: err.message }); 
  }
});

router.put('/shifts/:id', auth, orgAdmin, async (req, res) => {
  try {
    if (req.body.isDefault) {
      await Shift.updateMany({ orgId: req.orgId }, { isDefault: false });
    }
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      req.body,
      { new: true }
    );
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json(shift);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/shifts/:id', auth, orgAdmin, async (req, res) => {
  try {
    await Shift.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { isActive: false }
    );
    res.json({ message: 'Shift deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ============ CUSTOM FIELDS ============
router.get('/custom-fields', auth, async (req, res) => {
  try {
    const fields = await CustomField.find({ orgId: req.orgId, isActive: true }).sort('order');
    res.json(fields);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/custom-fields', auth, hrAdmin, async (req, res) => {
  try {
    // Generate key from name
    const key = req.body.key || req.body.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const field = new CustomField({ orgId: req.orgId, ...req.body, key });
    await field.save();
    res.status(201).json(field);
  } catch (err) { 
    if (err.code === 11000) return res.status(400).json({ message: 'Custom field key already exists' });
    res.status(500).json({ message: err.message }); 
  }
});

router.put('/custom-fields/:id', auth, hrAdmin, async (req, res) => {
  try {
    const field = await CustomField.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      req.body,
      { new: true }
    );
    if (!field) return res.status(404).json({ message: 'Custom field not found' });
    res.json(field);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/custom-fields/:id', auth, hrAdmin, async (req, res) => {
  try {
    await CustomField.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { isActive: false }
    );
    res.json({ message: 'Custom field deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
