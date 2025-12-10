const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Employee = require('../models/Employee');
const { Leave } = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Organization = require('../models/Organization');

// GET Dashboard Stats
router.get('/stats', auth, async (req, res) => {
  try {
    const { role, orgId } = req.user;
    const stats = {};

    // Common stats for all roles
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (role === 'PLATFORM_ADMIN') {
      // Platform Admin sees all organizations data
      stats.totalOrganizations = await Organization.countDocuments({ isActive: true });
      stats.totalEmployees = await Employee.countDocuments({ isActive: true });
      stats.totalUsers = await User.countDocuments({ isActive: true });
      stats.activeOrganizations = await Organization.countDocuments({ isActive: true });
      
      // Recent organizations
      stats.recentOrganizations = await Organization.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name code isActive createdAt');

    } else {
      // Organization-specific stats
      const employeeQuery = { orgId, isActive: true };
      const employee = await Employee.findOne({ userId: req.user._id, orgId });

      // Total employees
      stats.totalEmployees = await Employee.countDocuments(employeeQuery);

      // Today's attendance
      stats.todayAttendance = await Attendance.countDocuments({
        orgId,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['FULL_DAY', 'LATE', 'HALF_DAY', 'WFH', 'ON_DUTY'] }
      });

      // Attendance percentage for today
      if (stats.totalEmployees > 0) {
        stats.attendancePercentage = ((stats.todayAttendance / stats.totalEmployees) * 100).toFixed(1);
      } else {
        stats.attendancePercentage = 0;
      }

      // Pending leave approvals
      if (role === 'EMPLOYEE') {
        // Employees see their own stats
        if (employee) {
          stats.myPendingLeaves = await Leave.countDocuments({
            orgId,
            employeeId: employee._id,
            status: 'PENDING'
          });
          stats.myApprovedLeaves = await Leave.countDocuments({
            orgId,
            employeeId: employee._id,
            status: 'APPROVED',
            fromDate: { $gte: new Date() }
          });
          
          // My attendance this month
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          stats.myMonthAttendance = await Attendance.countDocuments({
            orgId,
            employeeId: employee._id,
            date: { $gte: monthStart, $lt: tomorrow },
            status: { $in: ['FULL_DAY', 'LATE', 'HALF_DAY', 'WFH', 'ON_DUTY'] }
          });
        }
      } else if (role === 'MANAGER') {
        // Managers see team stats
        if (employee) {
          const teamMembers = await Employee.find({
            orgId,
            'professional.reportingManager': employee._id,
            isActive: true
          }).select('_id');
          const teamIds = teamMembers.map(e => e._id);

          stats.teamSize = teamIds.length;
          stats.pendingLeaveApprovals = await Leave.countDocuments({
            orgId,
            employeeId: { $in: teamIds },
            status: 'PENDING'
          });
          stats.pendingAttendanceApprovals = await Attendance.countDocuments({
            orgId,
            employeeId: { $in: teamIds },
            'regularization.status': 'PENDING'
          });

          // Team attendance today
          stats.teamAttendanceToday = await Attendance.countDocuments({
            orgId,
            employeeId: { $in: teamIds },
            date: { $gte: today, $lt: tomorrow },
            status: { $in: ['FULL_DAY', 'LATE', 'HALF_DAY', 'WFH', 'ON_DUTY'] }
          });
        }
      } else {
        // HR_ADMIN and ORG_ADMIN see org-wide stats
        stats.pendingLeaveApprovals = await Leave.countDocuments({
          orgId,
          status: 'PENDING'
        });
        stats.pendingAttendanceApprovals = await Attendance.countDocuments({
          orgId,
          'regularization.status': 'PENDING'
        });

        // This month's stats
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        stats.monthlyAttendance = await Attendance.countDocuments({
          orgId,
          date: { $gte: monthStart, $lt: tomorrow },
          status: { $in: ['FULL_DAY', 'LATE', 'HALF_DAY', 'WFH', 'ON_DUTY'] }
        });

        stats.monthlyLeaves = await Leave.countDocuments({
          orgId,
          status: 'APPROVED',
          fromDate: { $gte: monthStart, $lte: tomorrow }
        });

        // Active users
        stats.activeUsers = await User.countDocuments({ orgId, isActive: true });
      }
    }

    // Recent activities (last 10)
    const recentActivities = [];

    if (role !== 'EMPLOYEE') {
      // Recent leave applications
      const recentLeaves = await Leave.find({ 
        orgId: role === 'PLATFORM_ADMIN' ? undefined : orgId,
        status: 'PENDING' 
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('employeeId', 'personal.firstName personal.lastName eId')
        .select('leaveType fromDate toDate createdAt');

      recentLeaves.forEach(leave => {
        recentActivities.push({
          type: 'leave',
          message: `${leave.employeeId?.personal?.firstName || 'Employee'} ${leave.employeeId?.personal?.lastName || ''} applied for ${leave.leaveType}`,
          date: leave.createdAt,
          status: 'pending'
        });
      });

      // Recent attendance regularizations
      const recentRegularizations = await Attendance.find({
        orgId: role === 'PLATFORM_ADMIN' ? undefined : orgId,
        'regularization.status': 'PENDING'
      })
        .sort({ 'regularization.requestedAt': -1 })
        .limit(5)
        .populate('employeeId', 'personal.firstName personal.lastName eId')
        .select('date regularization');

      recentRegularizations.forEach(att => {
        recentActivities.push({
          type: 'attendance',
          message: `${att.employeeId?.personal?.firstName || 'Employee'} ${att.employeeId?.personal?.lastName || ''} requested attendance regularization`,
          date: att.regularization?.requestedAt || att.date,
          status: 'pending'
        });
      });
    }

    // Sort activities by date
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    stats.recentActivities = recentActivities.slice(0, 10);

    res.json({ stats });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET Quick Actions based on role
router.get('/quick-actions', auth, async (req, res) => {
  try {
    const { role } = req.user;
    const actions = [];

    if (role === 'PLATFORM_ADMIN') {
      actions.push(
        { label: 'Add Organization', route: '/organizations', icon: 'Building2' },
        { label: 'Manage Users', route: '/users', icon: 'Users' }
      );
    } else if (role === 'ORG_ADMIN' || role === 'HR_ADMIN') {
      actions.push(
        { label: 'Add Employee', route: '/employees/new', icon: 'UserPlus' },
        { label: 'Approve Leaves', route: '/leaves/approvals', icon: 'CheckCircle' },
        { label: 'Approve Attendance', route: '/attendance/approvals', icon: 'Clock' },
        { label: 'Settings', route: '/settings', icon: 'Settings' }
      );
    } else if (role === 'MANAGER') {
      actions.push(
        { label: 'My Team', route: '/employees', icon: 'Users' },
        { label: 'Approve Leaves', route: '/leaves/approvals', icon: 'CheckCircle' },
        { label: 'Team Calendar', route: '/leaves/calendar', icon: 'Calendar' }
      );
    } else {
      actions.push(
        { label: 'Mark Attendance', route: '/attendance', icon: 'Clock' },
        { label: 'Apply Leave', route: '/leaves', icon: 'Umbrella' },
        { label: 'View Balance', route: '/leaves/balance', icon: 'Award' }
      );
    }

    res.json({ actions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;