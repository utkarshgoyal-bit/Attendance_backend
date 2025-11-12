import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true
    },

    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear()
    },

    casualLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 }
    },

    sickLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 12 }
    },

    earnedLeave: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 15 }
    }
  },
  {
    timestamps: true
  }
);

// ========== INDEXES ==========
// Composite index for querying by employee and year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

// ========== METHODS ==========

// Update leave balance after leave approval
leaveBalanceSchema.methods.deductLeave = function(leaveType, days) {
  const typeMap = {
    'CL': 'casualLeave',
    'SL': 'sickLeave',
    'EL': 'earnedLeave'
  };

  const balanceType = typeMap[leaveType];
  if (balanceType && this[balanceType]) {
    this[balanceType].used += days;
    this[balanceType].remaining = this[balanceType].total - this[balanceType].used;
  }
};

// Restore leave balance after leave rejection/cancellation
leaveBalanceSchema.methods.restoreLeave = function(leaveType, days) {
  const typeMap = {
    'CL': 'casualLeave',
    'SL': 'sickLeave',
    'EL': 'earnedLeave'
  };

  const balanceType = typeMap[leaveType];
  if (balanceType && this[balanceType]) {
    this[balanceType].used -= days;
    this[balanceType].remaining = this[balanceType].total - this[balanceType].used;
  }
};

// Check if employee has sufficient leave balance
leaveBalanceSchema.methods.hasBalance = function(leaveType, days) {
  const typeMap = {
    'CL': 'casualLeave',
    'SL': 'sickLeave',
    'EL': 'earnedLeave',
    'LWP': null // Leave Without Pay always allowed
  };

  const balanceType = typeMap[leaveType];

  // LWP doesn't need balance check
  if (!balanceType) return true;

  return this[balanceType] && this[balanceType].remaining >= days;
};

// ========== STATIC METHODS ==========

// Get or create leave balance for employee
leaveBalanceSchema.statics.getOrCreateBalance = async function(employeeId, year) {
  year = year || new Date().getFullYear();

  let balance = await this.findOne({ employeeId, year });

  if (!balance) {
    balance = await this.create({
      employeeId,
      year
    });
  }

  return balance;
};

// Reset all balances for new year
leaveBalanceSchema.statics.resetForNewYear = async function(year) {
  const employees = await mongoose.model('Employee').find({});

  const balances = employees.map(emp => ({
    employeeId: emp._id,
    year,
    casualLeave: { total: 12, used: 0, remaining: 12 },
    sickLeave: { total: 12, used: 0, remaining: 12 },
    earnedLeave: { total: 15, used: 0, remaining: 15 }
  }));

  await this.insertMany(balances, { ordered: false });
};

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema, "leaveBalance");

export default LeaveBalance;
