import { Leave, LeaveBalance } from "../models/Leave.model.js";
import Attendance from "../models/Attendance.model.js";
import Config from "../models/Config.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";

// Apply for leave
export const applyLeave = asyncHandler(async (req, res) => {
  const { employeeId, leaveType, startDate, endDate, numberOfDays, reason } = req.body;
  
  // Get or create balance
  let balance = await LeaveBalance.findOne({ employeeId });
  if (!balance) {
    balance = await LeaveBalance.create({ employeeId });
  }
  
  // Check balance (skip for LWP)
  if (leaveType !== "LWP") {
    const balanceMap = { CL: "casualLeave", SL: "sickLeave", EL: "earnedLeave" };
    const leaveCategory = balanceMap[leaveType];
    
    if (leaveCategory) {
      const remaining = balance[leaveCategory].total - balance[leaveCategory].used;
      if (remaining < numberOfDays) {
        return res.status(400).json({ 
          message: `Insufficient ${leaveCategory} balance. Available: ${remaining} days` 
        });
      }
    }
  }
  
  const leave = await Leave.create({
    employeeId, leaveType, startDate, endDate, numberOfDays, reason
  });
  
  res.status(201).json({ message: "Leave application submitted", leave });
});

// Get leaves
export const getLeaves = asyncHandler(async (req, res) => {
  const { employeeId, status, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  
  const total = await Leave.countDocuments(query);
  const leaves = await Leave.find(query)
    .populate("employeeId", "firstName lastName eId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  res.json({ leaves, total, pages: Math.ceil(total / limit) });
});

// Get leave balance
export const getLeaveBalance = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  
  let balance = await LeaveBalance.findOne({ employeeId });
  if (!balance) {
    balance = await LeaveBalance.create({ employeeId });
  }
  
  res.json({
    casualLeave: { ...balance.casualLeave.toObject(), remaining: balance.casualLeave.total - balance.casualLeave.used },
    sickLeave: { ...balance.sickLeave.toObject(), remaining: balance.sickLeave.total - balance.sickLeave.used },
    earnedLeave: { ...balance.earnedLeave.toObject(), remaining: balance.earnedLeave.total - balance.earnedLeave.used }
  });
});

// Approve leave
export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  
  if (!leave || leave.status !== "PENDING") {
    return res.status(400).json({ message: "Leave request not found or already processed" });
  }
  
  // Update balance
  if (leave.leaveType !== "LWP") {
    const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
    const balanceMap = { CL: "casualLeave", SL: "sickLeave", EL: "earnedLeave" };
    const category = balanceMap[leave.leaveType];
    
    if (balance && category) {
      balance[category].used += leave.numberOfDays;
      await balance.save();
    }
  }
  
  // Create attendance records for leave days
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const autoStatus = leave.leaveType === "LWP" ? "UNPAID_LEAVE" : "PAID_LEAVE";
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    
    await Attendance.findOneAndUpdate(
      { employeeId: leave.employeeId, date },
      {
        employeeId: leave.employeeId,
        date,
        checkInTime: new Date(date.setHours(9, 0, 0, 0)),
        status: "APPROVED",
        autoStatus
      },
      { upsert: true }
    );
  }
  
  leave.status = "APPROVED";
  leave.approvedBy = req.user.id;
  leave.approvedDate = new Date();
  await leave.save();
  
  res.json({ message: "Leave approved", leave });
});

// Reject leave
export const rejectLeave = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: "REJECTED", rejectionReason: reason, approvedBy: req.user.id, approvedDate: new Date() },
    { new: true }
  );
  
  if (!leave) {
    return res.status(404).json({ message: "Leave request not found" });
  }
  
  res.json({ message: "Leave rejected", leave });
});

// Bulk approve leaves
export const bulkApproveLeaves = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  let success = 0, failed = 0;
  
  for (const id of ids) {
    try {
      const leave = await Leave.findById(id);
      if (leave && leave.status === "PENDING") {
        // Update balance
        if (leave.leaveType !== "LWP") {
          const balance = await LeaveBalance.findOne({ employeeId: leave.employeeId });
          const balanceMap = { CL: "casualLeave", SL: "sickLeave", EL: "earnedLeave" };
          const category = balanceMap[leave.leaveType];
          if (balance && category) {
            balance[category].used += leave.numberOfDays;
            await balance.save();
          }
        }
        
        leave.status = "APPROVED";
        leave.approvedBy = req.user.id;
        leave.approvedDate = new Date();
        await leave.save();
        success++;
      }
    } catch (e) {
      failed++;
    }
  }
  
  res.json({ message: `${success} approved, ${failed} failed` });
});
