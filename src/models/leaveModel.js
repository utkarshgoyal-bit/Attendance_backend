import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    leaveType: {
      type: String,
      enum: ['CL', 'SL', 'EL', 'LWP'], // Casual, Sick, Earned, Leave Without Pay
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    numberOfDays: {
      type: Number,
      required: true,
      min: 0.5 // Allow half-day leaves
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },

    appliedDate: {
      type: Date,
      default: Date.now
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedDate: {
      type: Date
    },

    rejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// ========== INDEXES ==========
// Index for querying by employee and date
leaveSchema.index({ employeeId: 1, startDate: 1 });

// Index for filtering by status
leaveSchema.index({ status: 1 });

// Index for date range queries
leaveSchema.index({ startDate: 1, endDate: 1 });

// ========== METHODS ==========

// Check if leave dates overlap with existing leaves
leaveSchema.methods.checkOverlap = async function() {
  const Leave = this.constructor;

  const overlapping = await Leave.findOne({
    employeeId: this.employeeId,
    _id: { $ne: this._id }, // Exclude current document
    status: { $in: ['PENDING', 'APPROVED'] },
    $or: [
      {
        // New leave starts during existing leave
        startDate: { $lte: this.startDate },
        endDate: { $gte: this.startDate }
      },
      {
        // New leave ends during existing leave
        startDate: { $lte: this.endDate },
        endDate: { $gte: this.endDate }
      },
      {
        // New leave completely contains existing leave
        startDate: { $gte: this.startDate },
        endDate: { $lte: this.endDate }
      }
    ]
  });

  return !!overlapping;
};

// Calculate number of days between dates (excluding weekends)
leaveSchema.methods.calculateWorkingDays = function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  let count = 0;

  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    // Exclude Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

// ========== STATIC METHODS ==========

// Get leave statistics for an employee
leaveSchema.statics.getLeaveStats = async function(employeeId, year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);

  const stats = await this.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        startDate: { $gte: startOfYear, $lte: endOfYear },
        status: 'APPROVED'
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$numberOfDays' },
        count: { $sum: 1 }
      }
    }
  ]);

  return stats;
};

const Leave = mongoose.model("Leave", leaveSchema, "leave");

export default Leave;
