import mongoose from "mongoose";

const {
  Schema: { Types },
  model,
  Schema,
} = mongoose;

const leaveSchema = new Schema(
  {
    // Employee reference - which employee this leave record belongs to
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },

    // Leave type - type of leave being taken
    // CL: Casual Leave, SL: Sick Leave, EL: Earned Leave, LOP: Loss of Pay
    leaveType: {
      type: Types.String,
      enum: ['CL', 'SL', 'EL', 'LOP'],
      required: [true, 'Leave type is required'],
    },

    // Start date of the leave
    fromDate: {
      type: Types.Date,
      required: [true, 'From date is required'],
    },

    // End date of the leave
    toDate: {
      type: Types.Date,
      required: [true, 'To date is required'],
    },

    // Total number of days for this leave
    totalDays: {
      type: Types.Number,
      required: [true, 'Total days is required'],
      min: [0.5, 'Total days must be at least 0.5'],
    },

    // Reason for taking leave
    reason: {
      type: Types.String,
    },

    // Who marked/approved this leave - Manager or HR
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'MarkedBy is required'],
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Performance optimization indexes
// Index on employeeId for querying leaves by employee
leaveSchema.index({ employeeId: 1 });

// Index on fromDate for date range queries
leaveSchema.index({ fromDate: 1 });

// Compound index for efficient employee leave history queries
leaveSchema.index({ employeeId: 1, fromDate: 1 });

const Leave = mongoose.model("Leave", leaveSchema, "leave");

export default Leave;
