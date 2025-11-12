import Leave from "../models/leaveModel.js";
import LeaveBalance from "../models/leaveBalanceModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";

// Apply Leave
export const applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !numberOfDays || !reason) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Get/create balance
    let balance = await LeaveBalance.findOne({ employeeId });
    if (!balance) {
      const orgId = "673db4bb4ea85b50f50f20d4";
      const config = await OrganizationConfig.findOne({ orgId });

      balance = await LeaveBalance.create({
        employeeId,
        casualLeave: {
          total: config?.leavePolicy.casualLeave || 12,
          used: 0,
          remaining: config?.leavePolicy.casualLeave || 12
        },
        sickLeave: {
          total: config?.leavePolicy.sickLeave || 12,
          used: 0,
          remaining: config?.leavePolicy.sickLeave || 12
        },
        earnedLeave: {
          total: config?.leavePolicy.earnedLeave || 15,
          used: 0,
          remaining: config?.leavePolicy.earnedLeave || 15
        }
      });
    }

    // Check balance (skip for LWP)
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

    // Check for overlapping leaves
    const leave = new Leave({
      employeeId,
      leaveType,
      startDate,
      endDate,
      numberOfDays,
      reason,
      status: 'PENDING'
    });

    const hasOverlap = await leave.checkOverlap();
    if (hasOverlap) {
      return res.status(400).json({
        message: "Leave dates overlap with existing pending/approved leave"
      });
    }

    // Create leave
    await leave.save();

    res.status(201).json({
      message: "Leave application submitted successfully",
      leave
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Leave Balance
export const getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    let balance = await LeaveBalance.findOne({ employeeId });

    if (!balance) {
      const orgId = "673db4bb4ea85b50f50f20d4";
      const config = await OrganizationConfig.findOne({ orgId });

      balance = await LeaveBalance.create({
        employeeId,
        year: new Date().getFullYear(),
        casualLeave: {
          total: config?.leavePolicy.casualLeave || 12,
          used: 0,
          remaining: config?.leavePolicy.casualLeave || 12
        },
        sickLeave: {
          total: config?.leavePolicy.sickLeave || 12,
          used: 0,
          remaining: config?.leavePolicy.sickLeave || 12
        },
        earnedLeave: {
          total: config?.leavePolicy.earnedLeave || 15,
          used: 0,
          remaining: config?.leavePolicy.earnedLeave || 15
        }
      });
    }

    res.status(200).json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get All Leaves (with filters)
export const getLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'firstName lastName eId email')
      .sort({ appliedDate: -1 });

    res.status(200).json({ leaves });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get Pending Leaves
export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'PENDING' })
      .populate('employeeId', 'firstName lastName eId email')
      .sort({ appliedDate: -1 });

    res.status(200).json({ leaves });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approve Leave
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

    // Approve leave
    leave.status = 'APPROVED';
    leave.approvedBy = approvedBy;
    leave.approvedDate = new Date();
    await leave.save();

    // Populate for response
    await leave.populate('employeeId', 'firstName lastName eId email');

    res.status(200).json({
      message: "Leave approved successfully",
      leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reject Leave
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

    // Reject leave
    leave.status = 'REJECTED';
    leave.approvedBy = approvedBy;
    leave.approvedDate = new Date();
    leave.rejectionReason = rejectionReason || 'Not specified';
    await leave.save();

    // Populate for response
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

// Bulk Approve Leaves
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

        // Update balance
        if (leave.leaveType !== 'LWP') {
          const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
          if (balance) {
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
        }

        // Approve leave
        leave.status = 'APPROVED';
        leave.approvedBy = approvedBy;
        leave.approvedDate = new Date();
        await leave.save();

        results.push({ leaveId, status: 'success' });
        successCount++;
      } catch (error) {
        results.push({ leaveId, status: 'failed', reason: error.message });
        failCount++;
      }
    }

    res.status(200).json({
      message: `Bulk approval complete: ${successCount} approved, ${failCount} failed`,
      results,
      successCount,
      failCount
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: error.message });
  }
};
