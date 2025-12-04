import Attendance from "../models/Attendance.model.js";
import Config from "../models/Config.model.js";
import { QRCode } from "../models/Organization.model.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import crypto from "crypto";

// Get/Generate active QR code
export const getActiveQR = asyncHandler(async (req, res) => {
  const { orgId, branchId } = req.query;
  
  // Find or create QR code
  let qr = await QRCode.findOne({ 
    orgId, branchId, isActive: true,
    validTo: { $gt: new Date() }
  });
  
  if (!qr) {
    // Generate new QR code
    const config = await Config.findOne({ orgId });
    const validity = config?.qr?.validityMinutes || 2;
    
    qr = await QRCode.create({
      orgId, branchId,
      code: crypto.randomBytes(16).toString("hex"),
      validFrom: new Date(),
      validTo: new Date(Date.now() + validity * 60 * 1000)
    });
  }
  
  res.json({ qrCode: qr.code, validUntil: qr.validTo });
});

// Validate QR and check-in
export const checkIn = asyncHandler(async (req, res) => {
  const { employeeId, qrCode, branchId } = req.body;
  
  // Validate QR code
  const qr = await QRCode.findOne({ code: qrCode, isActive: true, validTo: { $gt: new Date() } });
  if (!qr) {
    return res.status(400).json({ message: "Invalid or expired QR code" });
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if already checked in today
  const existing = await Attendance.findOne({ employeeId, date: today });
  if (existing) {
    return res.status(400).json({ message: "Already checked in today" });
  }
  
  // Get config and calculate status
  const config = await Config.findOne({ orgId: qr.orgId });
  const autoStatus = config?.getAttendanceStatus(new Date()) || "FULL_DAY";
  
  const attendance = await Attendance.create({
    employeeId,
    date: today,
    checkInTime: new Date(),
    branchId: branchId || qr.branchId,
    qrCodeId: qr.code,
    autoStatus,
    status: "PENDING"
  });
  
  res.status(201).json({ message: "Check-in successful", attendance });
});

// Get today's attendance
export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { status, branchId } = req.query;
  const query = { date: today };
  if (status) query.status = status;
  if (branchId) query.branchId = branchId;
  
  const attendance = await Attendance.find(query)
    .populate("employeeId", "firstName lastName eId department")
    .sort({ checkInTime: -1 });
  
  res.json({ attendance, count: attendance.length });
});

// Approve attendance
export const approveAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status: "APPROVED", approvedBy: req.user.id, approvedAt: new Date() },
    { new: true }
  );
  
  if (!attendance) {
    return res.status(404).json({ message: "Attendance record not found" });
  }
  
  res.json({ message: "Attendance approved", attendance });
});

// Reject attendance
export const rejectAttendance = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const attendance = await Attendance.findByIdAndUpdate(
    req.params.id,
    { status: "REJECTED", rejectionReason: reason, approvedBy: req.user.id, approvedAt: new Date() },
    { new: true }
  );
  
  if (!attendance) {
    return res.status(404).json({ message: "Attendance record not found" });
  }
  
  res.json({ message: "Attendance rejected", attendance });
});

// Bulk approve
export const bulkApprove = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  const result = await Attendance.updateMany(
    { _id: { $in: ids }, status: "PENDING" },
    { status: "APPROVED", approvedBy: req.user.id, approvedAt: new Date() }
  );
  
  res.json({ message: `${result.modifiedCount} records approved` });
});

// Get monthly attendance
export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.query;
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = months.indexOf(month);
  
  if (monthIndex === -1) {
    return res.status(400).json({ message: "Invalid month name" });
  }
  
  const startDate = new Date(year, monthIndex, 1);
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  
  const records = await Attendance.find({
    employeeId,
    date: { $gte: startDate, $lte: endDate },
    status: "APPROVED"
  }).sort({ date: 1 });
  
  // Calculate summary
  const summary = {
    totalDays: endDate.getDate(),
    present: records.length,
    fullDays: records.filter(r => r.autoStatus === "FULL_DAY").length,
    lateDays: records.filter(r => r.autoStatus === "LATE").length,
    halfDays: records.filter(r => r.autoStatus === "HALF_DAY").length,
    leaves: records.filter(r => ["PAID_LEAVE", "UNPAID_LEAVE"].includes(r.autoStatus)).length
  };
  
  summary.absent = summary.totalDays - summary.present;
  
  res.json({ records, summary });
});
