const router = require('express').Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { auth, hrAdmin, manager } = require('../middleware/auth');

// Helper: Calculate status based on check-in time
const calculateStatus = (checkInTime, shift) => {
  if (!shift) return 'FULL_DAY';
  
  const checkIn = new Date(checkInTime);
  const [hours, minutes] = shift.startTime.split(':');
  const shiftStart = new Date(checkIn);
  shiftStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  const lateMinutes = (checkIn - shiftStart) / 60000;
  
  if (lateMinutes <= shift.gracePeriod) return 'FULL_DAY';
  if (lateMinutes <= shift.lateThreshold) return 'LATE';
  if (lateMinutes <= shift.halfDayThreshold) return 'HALF_DAY';
  return 'ABSENT';
};

// POST Check-in
router.post('/checkin', auth, async (req, res) => {
  try {
    const { location, method = 'MANUAL', remarks } = req.body;
    
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId }).populate('professional.shift');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const today = new Date().setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({ orgId: req.orgId, employeeId: employee._id, date: today });
    if (existing) return res.status(400).json({ message: 'Already checked in today' });
    
    const checkInTime = new Date();
    const status = calculateStatus(checkInTime, employee.professional.shift);
    
    const attendance = new Attendance({
      orgId: req.orgId,
      employeeId: employee._id,
      date: today,
      checkIn: { time: checkInTime, location, method },
      status,
      remarks
    });
    await attendance.save();
    
    res.json({ message: 'Check-in successful', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Check-out
router.post('/checkout', auth, async (req, res) => {
  try {
    const { location } = req.body;
    
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const today = new Date().setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ orgId: req.orgId, employeeId: employee._id, date: today });
    if (!attendance) return res.status(404).json({ message: 'No check-in found for today' });
    if (attendance.checkOut?.time) return res.status(400).json({ message: 'Already checked out' });
    
    const checkOutTime = new Date();
    attendance.checkOut = { time: checkOutTime, location };
    attendance.workingHours = (checkOutTime - attendance.checkIn.time) / 3600000;
    await attendance.save();
    
    res.json({ message: 'Check-out successful', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Today's attendance
router.get('/today', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const today = new Date().setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ orgId: req.orgId, employeeId: employee._id, date: today });
    
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET My attendance (employee's own)
router.get('/my', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const attendance = await Attendance.find({
      orgId: req.orgId,
      employeeId: employee._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Team attendance (manager)
router.get('/team', auth, manager, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const teamMembers = await Employee.find({ orgId: req.orgId, 'professional.reportingManager': employee._id }).select('_id');
    const teamIds = teamMembers.map(e => e._id);
    
    const today = new Date().setHours(0, 0, 0, 0);
    const attendance = await Attendance.find({
      orgId: req.orgId,
      employeeId: { $in: teamIds },
      date: today
    }).populate('employeeId', 'personal.firstName personal.lastName eId');
    
    res.json({ attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST Regularization request
router.post('/:id/regularize', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const attendance = await Attendance.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    
    attendance.regularization = {
      reason,
      requestedAt: new Date(),
      status: 'PENDING'
    };
    attendance.isRegularized = true;
    await attendance.save();
    
    res.json({ message: 'Regularization request submitted', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT Approve/Reject regularization
router.put('/:id/approve', auth, manager, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const attendance = await Attendance.findOne({ _id: req.params.id, orgId: req.orgId });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    
    if (status === 'APPROVED') {
      attendance.regularization.status = 'APPROVED';
      attendance.status = 'FULL_DAY';
    } else {
      attendance.regularization.status = 'REJECTED';
    }
    
    attendance.regularization.approvedBy = req.user._id;
    attendance.regularization.approvedAt = new Date();
    attendance.regularization.remarks = remarks;
    await attendance.save();
    
    res.json({ message: `Regularization ${status.toLowerCase()}`, attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Pending approvals
router.get('/pending', auth, manager, async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user._id, orgId: req.orgId });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    
    const teamMembers = await Employee.find({ orgId: req.orgId, 'professional.reportingManager': employee._id }).select('_id');
    const teamIds = teamMembers.map(e => e._id);
    
    const pending = await Attendance.find({
      orgId: req.orgId,
      employeeId: { $in: teamIds },
      isRegularized: true,
      'regularization.status': 'PENDING'
    }).populate('employeeId', 'personal.firstName personal.lastName eId').sort({ date: -1 });
    
    res.json({ attendance: pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET Monthly report
router.get('/report', auth, async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const targetEmployee = employeeId || (await Employee.findOne({ userId: req.user._id, orgId: req.orgId }))?._id;
    
    const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    const attendance = await Attendance.find({
      orgId: req.orgId,
      employeeId: targetEmployee,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });
    
    const summary = {
      totalDays: attendance.length,
      present: attendance.filter(a => ['FULL_DAY', 'LATE'].includes(a.status)).length,
      late: attendance.filter(a => a.status === 'LATE').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      wfh: attendance.filter(a => a.status === 'WFH').length,
    };
    
    res.json({ attendance, summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;