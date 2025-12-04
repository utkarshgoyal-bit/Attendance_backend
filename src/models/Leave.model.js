import mongoose from "mongoose";

// Leave Request Schema
const leaveSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true, 
    index: true 
  },
  leaveType: { 
    type: String, 
    enum: ["CL", "SL", "EL", "LWP", "MATERNITY", "PATERNITY"], 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ["PENDING", "APPROVED", "REJECTED"], 
    default: "PENDING",
    index: true 
  },
  
  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  approvedDate: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

leaveSchema.index({ employeeId: 1, status: 1 });

// Leave Balance Schema
const leaveBalanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true, 
    unique: true 
  },
  year: { type: Number, default: () => new Date().getFullYear() },
  
  casualLeave: { total: { type: Number, default: 12 }, used: { type: Number, default: 0 } },
  sickLeave: { total: { type: Number, default: 12 }, used: { type: Number, default: 0 } },
  earnedLeave: { total: { type: Number, default: 24 }, used: { type: Number, default: 0 } }
}, { timestamps: true });

// Virtual for remaining leaves
leaveBalanceSchema.virtual("casualLeave.remaining").get(function() {
  return this.casualLeave.total - this.casualLeave.used;
});
leaveBalanceSchema.virtual("sickLeave.remaining").get(function() {
  return this.sickLeave.total - this.sickLeave.used;
});
leaveBalanceSchema.virtual("earnedLeave.remaining").get(function() {
  return this.earnedLeave.total - this.earnedLeave.used;
});

export const Leave = mongoose.model("Leave", leaveSchema, "leaves");
export const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema, "leavebalances");
