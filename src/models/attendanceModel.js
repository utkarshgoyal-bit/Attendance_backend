import mongoose from "mongoose";

const {
  Schema: { Types },
  model,
  Schema,
} = mongoose;

const attendanceSchema = new Schema(
  {
    // Employee reference - which employee this attendance record belongs to
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },

    // Attendance date - the date for which attendance is marked
    date: {
      type: Types.Date,
      required: [true, 'Date is required'],
    },

    // Check-in time - when employee checked in
    checkInTime: {
      type: Types.Date,
      required: [true, 'Check-in time is required'],
    },

    // Approval status - workflow state of the attendance
    status: {
      type: Types.String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },

    // Auto-calculated status based on check-in time
    autoStatus: {
      type: Types.String,
      enum: ['FULL_DAY', 'LATE', 'HALF_DAY', 'ABSENT'],
    },

    // Branch identifier - which branch/location employee checked in at
    branchId: {
      type: Types.String,
    },

    // QR Code identifier - tracks which QR code was scanned
    qrCodeId: {
      type: Types.String,
    },

    // Approval details - who approved and when
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    approvedAt: {
      type: Types.Date,
    },

    // Rejection reason - if status is REJECTED
    rejectionReason: {
      type: Types.String,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Performance optimization indexes
// Compound unique index - ensures one attendance record per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index on date for querying attendance by date range
attendanceSchema.index({ date: 1 });

// Index on status for filtering pending/approved/rejected records
attendanceSchema.index({ status: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema, "attendance");

export default Attendance;
