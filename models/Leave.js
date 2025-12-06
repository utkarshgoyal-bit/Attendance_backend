const mongoose = require('mongoose');

// Leave Application Schema
const leaveSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  
  leaveType: { type: String, required: true }, // CL, SL, PL, LWP, etc.
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  days: { type: Number, required: true }, // Total days including half-day
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['FIRST_HALF', 'SECOND_HALF', ''] }, // Only if isHalfDay
  
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  
  // Approval workflow
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  approverRemarks: String,
  
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  
  // Contact during leave
  contactNumber: String,
  emergencyContact: String,
  
}, { timestamps: true });

leaveSchema.index({ orgId: 1, employeeId: 1, fromDate: 1 });
leaveSchema.index({ orgId: 1, status: 1 });

// Leave Balance Schema
const leaveBalanceSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  year: { type: Number, required: true, index: true }, // Financial year
  
  // Map of leave type to balance
  // Example: { "CL": 12, "SL": 6, "PL": 15 }
  balances: { type: Map, of: Number, default: {} },
  
  // Carry forward from previous year
  carryForward: { type: Map, of: Number, default: {} },
  
  // Used leaves
  used: { type: Map, of: Number, default: {} },
  
  // Available = balances + carryForward - used
  
}, { timestamps: true });

leaveBalanceSchema.index({ orgId: 1, employeeId: 1, year: 1 }, { unique: true });

// Helper method to get available balance
leaveBalanceSchema.methods.getAvailable = function(leaveType) {
  const balance = this.balances.get(leaveType) || 0;
  const carry = this.carryForward.get(leaveType) || 0;
  const used = this.used.get(leaveType) || 0;
  return balance + carry - used;
};

module.exports = {
  Leave: mongoose.model('Leave', leaveSchema),
  LeaveBalance: mongoose.model('LeaveBalance', leaveBalanceSchema),
};