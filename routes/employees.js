const router = require('express').Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const { auth, hrAdmin, manager } = require('../middleware/auth');

// GET all employees
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, status, branch } = req.query;
    const query = { orgId: req.orgId };
    
    if (search) {
      query.$or = [
        { 'personal.firstName': { $regex: search, $options: 'i' } },
        { 'personal.lastName': { $regex: search, $options: 'i' } },
        { 'personal.email': { $regex: search, $options: 'i' } },
        { eId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query['professional.department'] = department;
    if (status) query['professional.status'] = status;
    if (branch) query['professional.branch'] = branch;
    
    // Manager can only see their team
    if (req.user.role === 'MANAGER' && req.user.employeeId) {
      query['professional.reportingManager'] = req.user.employeeId;
    }
    
    const employees = await Employee.find(query)
      .populate('professional.department', 'name')
      .populate('professional.branch', 'name')
      .populate('professional.shift', 'name')
      .populate('professional.reportingManager', 'personal.firstName personal.lastName eId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Employee.countDocuments(query);
    
    res.json({ employees, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId })
      .populate('professional.department', 'name')
      .populate('professional.branch', 'name')
      .populate('professional.shift', 'name startTime endTime')
      .populate('professional.reportingManager', 'personal.firstName personal.lastName eId');
    
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Employee can only view their own profile
    if (req.user.role === 'EMPLOYEE' && req.user.employeeId?.toString() !== employee._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create employee
router.post('/', auth, hrAdmin, async (req, res) => {
  try {
    const { personal, professional, bank, createUser, password } = req.body;
    
    // Generate Employee ID if not provided
    let eId = req.body.eId;
    if (!eId) {
      const count = await Employee.countDocuments({ orgId: req.orgId });
      eId = `EMP${String(count + 1).padStart(4, '0')}`;
    }
    
    // Check duplicate
    const existing = await Employee.findOne({ 
      orgId: req.orgId, 
      $or: [{ eId }, { 'personal.email': personal.email }] 
    });
    if (existing) {
      return res.status(400).json({ message: 'Employee ID or Email already exists' });
    }
    
    const employee = new Employee({
      orgId: req.orgId,
      eId,
      personal,
      professional,
      bank,
    });
    
    // Create user account if requested
    if (createUser && personal.email) {
      const existingUser = await User.findOne({ email: personal.email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const role = professional.reportingManager ? 'EMPLOYEE' : 'EMPLOYEE';
      const user = new User({
        email: personal.email,
        password: password || 'Welcome@123',
        role: req.body.role || 'EMPLOYEE',
        orgId: req.orgId,
        isFirstLogin: true,
      });
      await user.save();
      employee.userId = user._id;
    }
    
    await employee.save();
    
    res.status(201).json({ message: 'Employee created', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update employee
router.put('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Employee can only update limited fields
    const isOwnProfile = req.user.employeeId?.toString() === employee._id.toString();
    const isHrOrAbove = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN'].includes(req.user.role);
    
    if (!isHrOrAbove && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { personal, professional, bank, customFields } = req.body;
    
    if (isOwnProfile && !isHrOrAbove) {
      // Limited self-edit
      if (personal) {
        employee.personal.phone = personal.phone || employee.personal.phone;
        employee.personal.currentAddress = personal.currentAddress || employee.personal.currentAddress;
        employee.personal.emergencyContact = personal.emergencyContact || employee.personal.emergencyContact;
        employee.personal.photo = personal.photo || employee.personal.photo;
      }
      if (bank) {
        employee.bank = { ...employee.bank, ...bank };
      }
    } else {
      // Full edit for HR
      if (personal) employee.personal = { ...employee.personal, ...personal };
      if (professional) employee.professional = { ...employee.professional, ...professional };
      if (bank) employee.bank = { ...employee.bank, ...bank };
      if (customFields) employee.customFields = new Map(Object.entries(customFields));
    }
    
    await employee.save();
    res.json({ message: 'Employee updated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update status
router.patch('/:id/status', auth, hrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { 'professional.status': status },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Status updated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload document
router.post('/:id/documents', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    const { type, name, url } = req.body;
    employee.documents.push({ type, name, url });
    await employee.save();
    
    res.json({ message: 'Document uploaded', documents: employee.documents });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE document
router.delete('/:id/documents/:docId', auth, hrAdmin, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    employee.documents = employee.documents.filter(d => d._id.toString() !== req.params.docId);
    await employee.save();
    
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST initiate exit
router.post('/:id/exit', auth, hrAdmin, async (req, res) => {
  try {
    const { resignationDate, lastWorkingDate, reason } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { 
        'professional.status': 'Notice Period',
        'exit.resignationDate': resignationDate,
        'exit.lastWorkingDate': lastWorkingDate,
        'exit.reason': reason,
        'exit.fnfStatus': 'Pending',
      },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Exit initiated', employee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', auth, hrAdmin, async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, orgId: req.orgId },
      { isActive: false, 'professional.status': 'Terminated' },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    
    // Deactivate user account
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }
    
    res.json({ message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
