import Leave from "../models/leaveModel.js";
import LeaveBalance from "../models/leaveBalanceModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";
import Attendance from "../models/attendanceModel.js";

// ========== APPLY LEAVE (USES DYNAMIC LEAVE SETTINGS) ==========
export const applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !numberOfDays || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const orgId = "673db4bb4ea85b50f50f20d4";
    const config = await OrganizationConfig.findOne({ orgId });

    // Check if leave settings are enabled
    if (!config.leaveSettings.enabled) {
      return res.status(400).json({ 
        message: "Leave system is currently disabled. Please contact HR." 
      });
    }

    // ========== GET LEAVE QUOTAS FROM DYNAMIC FIELDS ==========
    const casualLeaveQuota = config.getFieldValue('leaveSettings', 'casualLeave') || 12;
    const sickLeaveQuota = config.getFieldValue('leaveSettings', 'sickLeave') || 12;
    const paidLeaveQuota = config.getFieldValue('leaveSettings', 'paidLeave') || 24;
    const unpaidLeaveAllowed = config.getFieldValue('leaveSettings', 'unpaidLeaveAllowed');

    // Check if unpaid leave is allowed
    if (leaveType === 'LWP' && !unpaidLeaveAllowed) {
      return res.status(400).json({
        message: "Unpaid leave is not allowed as per company policy."
      });
    }

    // Get/create balance
    let balance = await LeaveBalance.findOne({ employeeId });
    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        casualLeave: { total: casualLeaveQuota, used: 0, remaining: casualLeaveQuota },
        sickLeave: { total: sickLeaveQuota, used: 0, remaining: sickLeaveQuota },
        earnedLeave: { total: paidLeaveQuota, used: 0, remaining: paidLeaveQuota }
      });
    }

    // Check balance
    if (leaveType === 'CL' && balance.casualLeave.remaining < numberOfDays) {
      return res.status(400).json({
        message: `Insufficient casual leave balance. Available: ${balance.casualLeave.remaining} days`
      });
    }
    if (leaveType === 'SL' && balance.sickLeave.remaining < numberOfDays) {
      return res.status(400).json({
        message: `Insufficient sick leave balance. Available: ${balance.sickLeave.remaining} days`
      });
    }
    if (leaveType === 'EL' && balance.earnedLeave.remaining < numberOfDays) {
      return res.status(400).json({
        message: `Insufficient earned leave balance. Available: ${balance.earnedLeave.remaining} days`
      });
    }

    // Create leave application
    const leave = await Leave.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      status: 'PENDING'
    });

    await leave.populate('employeeId', 'firstName lastName eId email');

    res.status(201).json({
      message: "Leave application submitted successfully",
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET LEAVE BALANCE (USES DYNAMIC QUOTAS) ==========
export const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const orgId = "673db4bb4ea85b50f50f20d4";
    const config = await OrganizationConfig.findOne({ orgId });

    // Get quotas from dynamic fields
    const casualLeaveQuota = config.getFieldValue('leaveSettings', 'casualLeave') || 12;
    const sickLeaveQuota = config.getFieldValue('leaveSettings', 'sickLeave') || 12;
    const paidLeaveQuota = config.getFieldValue('leaveSettings', 'paidLeave') || 24;

    let balance = await LeaveBalance.findOne({ employeeId });

    if (!balance) {
      balance = await LeaveBalance.create({
        employeeId,
        casualLeave: { total: casualLeaveQuota, used: 0, remaining: casualLeaveQuota },
        sickLeave: { total: sickLeaveQuota, used: 0, remaining: sickLeaveQuota },
        earnedLeave: { total: paidLeaveQuota, used: 0, remaining: paidLeaveQuota }
      });
    }

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET ALL LEAVES ==========
export const getLeaves = async (req, res) => {
  try {
    const { status, employeeId, startDate, endDate } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'firstName lastName eId email department')
      .sort({ createdAt: -1 });

    res.status(200).json({ leaves, count: leaves.length });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== GET PENDING LEAVES ==========
export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'PENDING' })
      .populate('employeeId', 'firstName lastName eId email department')
      .sort({ createdAt: -1 });

    res.status(200).json({ leaves, count: leaves.length });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== APPROVE LEAVE (CREATES ATTENDANCE RECORDS) ==========
export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        message: `Leave is already ${leave.status.toLowerCase()}`
      });
    }

    const orgId = "673db4bb4ea85b50f50f20d4";
    const config = await OrganizationConfig.findOne({ orgId });

    // Update balance (skip for LWP)
    if (leave.leaveType !== 'LWP') {
      const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });

      if (!balance) {
        return res.status(404).json({ message: "Leave balance not found" });
      }

      if (leave.leaveType === 'CL') {
        balance.casualLeave.used += leave.numberOfDays;
        balance.casualLeave.remaining = balance.casualLeave.total - balance.casualLeave.used;
      } else if (leave.leaveType === 'SL') {
        balance.sickLeave.used += leave.numberOfDays;
        balance.sickLeave.remaining = balance.sickLeave.total - balance.sickLeave.used;
      } else if (leave.leaveType === 'EL') {
        balance.earnedLeave.used += leave.numberOfDays;
        balance.earnedLeave.remaining = balance.earnedLeave.total - balance.earnedLeave.used;
      }

      await balance.save();
    }

    // ========== AUTO-CREATE ATTENDANCE RECORDS FOR LEAVE DAYS ==========
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const attendanceRecords = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);

      // ========== CHECK IF IT'S A WORKING DAY (USES DYNAMIC FIELDS) ==========
      const isWorkingDay = config.isWorkingDay(dayStart);
      
      if (!isWorkingDay) {
        console.log(`Skipping ${dayStart.toDateString()} - Not a working day`);
        continue; // Skip non-working days
      }

      // Check if attendance already exists
      const exists = await Attendance.findOne({
        employeeId: leave.employeeId,
        date: dayStart
      });

      if (!exists) {
        const autoStatus = leave.leaveType === 'LWP' ? 'UNPAID_LEAVE' : 'PAID_LEAVE';

        const attendance = await Attendance.create({
          employeeId: leave.employeeId,
          date: dayStart,
          checkInTime: new Date(dayStart.setHours(9, 0, 0, 0)),
          status: 'APPROVED',
          autoStatus: autoStatus,
          branchId: 'JAIPUR',
          qrCodeId: 'LEAVE_AUTO',
          approvedBy: approvedBy,
          approvedAt: new Date()
        });

        attendanceRecords.push(attendance);
      }
    }

    console.log(`Created ${attendanceRecords.length} attendance records for approved leave`);

    leave.status = 'APPROVED';
    leave.approvedBy = approvedBy;
    leave.approvedDate = new Date();
    await leave.save();

    await leave.populate('employeeId', 'firstName lastName eId email');

    res.status(200).json({
      message: "Leave approved successfully",
      leave,
      attendanceRecordsCreated: attendanceRecords.length
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== REJECT LEAVE ==========
export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, rejectionReason } = req.body;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== 'PENDING') {
      return res.status(400).json({
        message: `Leave is already ${leave.status.toLowerCase()}`
      });
    }

    leave.status = 'REJECTED';
    leave.approvedBy = approvedBy;
    leave.approvedDate = new Date();
    leave.rejectionReason = rejectionReason || 'Not specified';
    await leave.save();

    await leave.populate('employeeId', 'firstName lastName eId email');

    res.status(200).json({
      message: "Leave rejected",
      leave
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========== BULK APPROVE LEAVES ==========
export const bulkApproveLeaves = async (req, res) => {
  try {
    const { leaveIds, approvedBy } = req.body;

    if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
      return res.status(400).json({ message: "Leave IDs are required" });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const leaveId of leaveIds) {
      try {
        const leave = await Leave.findById(leaveId);
        if (!leave || leave.status !== 'PENDING') {
          results.push({ leaveId, status: 'failed', reason: 'Invalid leave' });
          failCount++;
          continue;
        }

        const orgId = "673db4bb4ea85b50f50f20d4";
        const config = await OrganizationConfig.findOne({ orgId });

        // Update balance (skip for LWP)
        if (leave.leaveType !== 'LWP') {
          const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
          if (!balance) {
            results.push({ leaveId, status: 'failed', reason: 'Balance not found' });
            failCount++;
            continue;
          }

          if (leave.leaveType === 'CL') {
            balance.casualLeave.used += leave.numberOfDays;
            balance.casualLeave.remaining = balance.casualLeave.total - balance.casualLeave.used;
          } else if (leave.leaveType === 'SL') {
            balance.sickLeave.used += leave.numberOfDays;
            balance.sickLeave.remaining = balance.sickLeave.total - balance.sickLeave.used;
          } else if (leave.leaveType === 'EL') {
            balance.earnedLeave.used += leave.numberOfDays;
            balance.earnedLeave.remaining = balance.earnedLeave.total - balance.earnedLeave.used;
          }

          await balance.save();
        }

        // Create attendance records for working days only
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayStart = new Date(d);
          dayStart.setHours(0, 0, 0, 0);

          // Check if working day
          const isWorkingDay = config.isWorkingDay(dayStart);
          if (!isWorkingDay) continue;

          const exists = await Attendance.findOne({
            employeeId: leave.employeeId,
            date: dayStart
          });

          if (!exists) {
            const autoStatus = leave.leaveType === 'LWP' ? 'UNPAID_LEAVE' : 'PAID_LEAVE';

            await Attendance.create({
              employeeId: leave.employeeId,
              date: dayStart,
              checkInTime: new Date(dayStart.setHours(9, 0, 0, 0)),
              status: 'APPROVED',
              autoStatus: autoStatus,
              branchId: 'JAIPUR',
              qrCodeId: 'LEAVE_AUTO',
              approvedBy: approvedBy,
              approvedAt: new Date()
            });
          }
        }

        leave.status = 'APPROVED';
        leave.approvedBy = approvedBy;
        leave.approvedDate = new Date();
        await leave.save();

        results.push({ leaveId, status: 'success' });
        successCount++;
      } catch (error) {
        console.error(`Error approving leave ${leaveId}:`, error);
        results.push({ leaveId, status: 'failed', reason: error.message });
        failCount++;
      }
    }

    res.status(200).json({
      message: `Bulk approval completed: ${successCount} succeeded, ${failCount} failed`,
      results,
      successCount,
      failCount
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: error.message });
  }
};