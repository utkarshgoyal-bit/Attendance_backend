const router = require('express').Router();
const { Leave, LeaveBalance } = require('../models/Leave');
const Employee = require('../models/Employee');
const Organization = require('../models/Organization');
const { auth, hrAdmin, manager } = require('../middleware/auth');

// Helper: Calculate working days between two dates (excluding weekends)
const calculateWorkingDays = (fromDate, toDate, workingDays = ['Mon','Tue','Wed','Thu','Fri','Sat']) => {
  const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const workingDayNums = workingDays.map(d => dayMap[d]);
  
  let count = 0;
  const current = new Date(fromDate);
  const end = new Date(toDate);
  
  while (current <= end) {
    if (workingDayNums.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

// Helper: Get or create leave balance for employee
const getOrCreateBalance = async (orgId, employeeId, year) => {
  let balance = await LeaveBalance.findOne({ orgId, employeeId, year });
  
  if (!balance) {
    // Create new balance with org's default quotas
    const org = await Organization.findById(orgId);
    const balances = {};
    
    if (org?.leaveConfig?.types) {
      org.leaveConfig.types.forEach(type => {
        balances[type.code] = type.defaultQuota || 0;
      });
    }
    
    balance = new LeaveBalance({
      orgId,
      employeeId,
      year,
      balances: new Map(Object.entries(balances)),
      used: new Map(),
      carryForward: new Map(),
    });
    await balance.save();
  }
  
  return balance;
};

// POST Apply Leave
router.post('/apply', auth, async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, isHalfDay, halfDayType, contactNumber } = req.body;
    
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId }).populate('professional.reportingManager');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const org = await Organization.findById(req.orgId);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Calculate days
    let days = isHalfDay ? 0.5 : calculateWorkingDays(from, to, org?.leaveConfig?.workingDays);
    
    // Get leave balance
    const year = from.getFullYear();
    const balance = await getOrCreateBalance(req.orgId, employee._id, year);
    const available = balance.getAvailable(leaveType);
    
    // Check if sufficient balance (except LWP)
    if (leaveType !== 'LWP' && available < days) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. Available: ${available}, Requested: ${days}` 
      });
    }
    
    // Check for overlapping leaves
    const overlap = await Leave.findOne({
      orgId: req.orgId,
      employeeId: employee._id,
      status: { $in: ['PENDING', 'APPROVED'] },
      $or: [
        { fromDate: { $lte: to }, toDate: { $gte: from } }
      ]
    });
    if (overlap) {
      return res.status(400).json({ message: 'Leave dates overlap with existing leave' });
    }
    
    const leave = new Leave({
      orgId: req.orgId,
      employeeId: employee._id,
      leaveType,
      fromDate: from,
      toDate: to,
      days,
      isHalfDay,
      halfDayType,
      reason,
      contactNumber,
      status: 'PENDING',
    });
    
    await leave.save();
    
    res.status(201).json({ message: 'Leave application submitted', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET My Leaves
router.get('/my', auth, async (req, res) => {
  try {
    const { status, year } = req.query;
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const query = { orgId: req.orgId, employeeId: employee._id };
    if (status) query.status = status;
    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      query.fromDate = { $gte: startDate, $lte: endDate };
    }
    
    const leaves = await Leave.find(query)
      .populate('approver', 'email')
      .sort({ createdAt: -1 });
    
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Pending Approvals (for managers/HR)
router.get('/pending', auth, manager, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    let query = { orgId: req.orgId, status: 'PENDING' };
    
    // Manager: only their team
    if (req.user.role === 'MANAGER') {
      const teamMembers = await Employee.find({ 
        orgId: req.orgId, 
        'professional.reportingManager': employee._id 
      }).select('_id');
      const teamIds = teamMembers.map(e => e._id);
      query.employeeId = { $in: teamIds };
    }
    // HR/Admin: all pending
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'personal.firstName personal.lastName eId professional.department')
      .populate({
        path: 'employeeId',
        populate: { path: 'professional.department', select: 'name' }
      })
      .sort({ createdAt: -1 });
    
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Team Leaves (for managers)
router.get('/team', auth, manager, async (req, res) => {
  try {
    const { status, month, year } = req.query;
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const teamMembers = await Employee.find({ 
      orgId: req.orgId, 
      'professional.reportingManager': employee._id 
    }).select('_id');
    const teamIds = teamMembers.map(e => e._id);
    
    const query = { orgId: req.orgId, employeeId: { $in: teamIds } };
    if (status) query.status = status;
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      query.$or = [
        { fromDate: { $gte: startDate, $lte: endDate } },
        { toDate: { $gte: startDate, $lte: endDate } }
      ];
    }
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'personal.firstName personal.lastName eId')
      .sort({ fromDate: -1 });
    
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Approve Leave
router.put('/:id/approve', auth, manager, async (req, res) => {
  try {
    const { remarks } = req.body;
    const leave = await Leave.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'PENDING') {
      return res.status(400).json({ message: 'Leave already processed' });
    }
    
    leave.status = 'APPROVED';
    leave.approver = req.user._id;
    leave.approvedAt = new Date();
    leave.approverRemarks = remarks;
    await leave.save();
    
    // Update leave balance
    const year = leave.fromDate.getFullYear();
    const balance = await getOrCreateBalance(req.orgId, leave.employeeId, year);
    const currentUsed = balance.used.get(leave.leaveType) || 0;
    balance.used.set(leave.leaveType, currentUsed + leave.days);
    await balance.save();
    
    res.json({ message: 'Leave approved', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Reject Leave
router.put('/:id/reject', auth, manager, async (req, res) => {
  try {
    const { remarks } = req.body;
    const leave = await Leave.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    if (leave.status !== 'PENDING') {
      return res.status(400).json({ message: 'Leave already processed' });
    }
    
    leave.status = 'REJECTED';
    leave.approver = req.user._id;
    leave.approvedAt = new Date();
    leave.approverRemarks = remarks;
    await leave.save();
    
    res.json({ message: 'Leave rejected', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE Cancel Leave (by employee)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const leave = await Leave.findOne({ 
      _id: req.params.id, 
      orgId: req.orgId,
      employeeId: employee._id 
    });
    if (!leave) return res.status(404).json({ message: 'Leave not found' });
    
    if (leave.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Leave already cancelled' });
    }
    if (leave.status === 'APPROVED' && new Date(leave.fromDate) < new Date()) {
      return res.status(400).json({ message: 'Cannot cancel past approved leave' });
    }
    
    const previousStatus = leave.status;
    leave.status = 'CANCELLED';
    leave.cancelledAt = new Date();
    leave.cancellationReason = reason;
    await leave.save();
    
    // If was approved, restore balance
    if (previousStatus === 'APPROVED') {
      const year = leave.fromDate.getFullYear();
      const balance = await getOrCreateBalance(req.orgId, leave.employeeId, year);
      const currentUsed = balance.used.get(leave.leaveType) || 0;
      balance.used.set(leave.leaveType, Math.max(0, currentUsed - leave.days));
      await balance.save();
    }
    
    res.json({ message: 'Leave cancelled', leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Leave Balance for current employee
router.get('/balance', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const year = new Date().getFullYear();
    const balance = await getOrCreateBalance(req.orgId, employee._id, year);
    
    // Convert Map to Object for JSON response
    const balanceData = {
      year,
      balances: Object.fromEntries(balance.balances),
      used: Object.fromEntries(balance.used),
      carryForward: Object.fromEntries(balance.carryForward),
      available: {}
    };
    
    // Calculate available for each type
    balance.balances.forEach((value, key) => {
      balanceData.available[key] = balance.getAvailable(key);
    });
    
    res.json({ balance: balanceData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Leave Balance for specific employee (HR/Admin only)
router.get('/balance/:employeeId', auth, hrAdmin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    
    const year = new Date().getFullYear();
    const balance = await getOrCreateBalance(req.orgId, employeeId, year);
    
    // Convert Map to Object for JSON response
    const balanceData = {
      year,
      balances: Object.fromEntries(balance.balances),
      used: Object.fromEntries(balance.used),
      carryForward: Object.fromEntries(balance.carryForward),
      available: {}
    };
    
    // Calculate available for each type
    balance.balances.forEach((value, key) => {
      balanceData.available[key] = balance.getAvailable(key);
    });
    
    res.json({ balance: balanceData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Credit Leave (HR/Admin only)
router.post('/credit', auth, hrAdmin, async (req, res) => {
  try {
    const { employeeId, leaveType, days, year, reason } = req.body;
    
    const currentYear = year || new Date().getFullYear();
    const balance = await getOrCreateBalance(req.orgId, employeeId, currentYear);
    
    const currentBalance = balance.balances.get(leaveType) || 0;
    balance.balances.set(leaveType, currentBalance + days);
    await balance.save();
    
    res.json({ 
      message: `${days} days of ${leaveType} credited successfully`,
      balance: {
        year: currentYear,
        balances: Object.fromEntries(balance.balances),
        used: Object.fromEntries(balance.used),
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Leave Calendar (for team view)
router.get('/calendar', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    let query = { 
      orgId: req.orgId, 
      status: 'APPROVED',
      $or: [
        { fromDate: { $gte: startDate, $lte: endDate } },
        { toDate: { $gte: startDate, $lte: endDate } },
        { fromDate: { $lte: startDate }, toDate: { $gte: endDate } }
      ]
    };
    
    // If manager, filter to team
    if (req.user.role === 'MANAGER') {
      const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
      if (employee) {
        const teamMembers = await Employee.find({ 
          orgId: req.orgId, 
          'professional.reportingManager': employee._id 
        }).select('_id');
        const teamIds = teamMembers.map(e => e._id);
        query.employeeId = { $in: teamIds };
      }
    }
    
    const leaves = await Leave.find(query)
      .populate('employeeId', 'personal.firstName personal.lastName eId')
      .sort({ fromDate: 1 });
    
    res.json({ leaves, month: currentMonth, year: currentYear });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;