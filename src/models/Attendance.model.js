import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true,
    index: true 
  },
  date: { type: Date, required: true },
  checkInTime: { type: Date, required: true },
  checkOutTime: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ["PENDING", "APPROVED", "REJECTED"], 
    default: "PENDING",
    index: true 
  },
  autoStatus: { 
    type: String, 
    enum: ["FULL_DAY", "LATE", "HALF_DAY", "ABSENT", "PAID_LEAVE", "UNPAID_LEAVE", "HOLIDAY", "WEEK_OFF"]
  },
  
  // Location
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  qrCodeId: { type: String },
  
  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  approvedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

// Compound unique index - one attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model("Attendance", attendanceSchema, "attendance");
