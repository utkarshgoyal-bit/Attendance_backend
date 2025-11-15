import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    // Employee reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },

    // Salary structure reference
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeSalaryStructure'
    },

    // Period
    month: {
      type: String,
      required: [true, 'Month is required'],
      enum: ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December']
    },

    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2020,
      max: 2100
    },

    // ========== ATTENDANCE DATA ==========
    attendanceData: {
      totalDays: {
        type: Number,
        required: true
      },
      presentDays: {
        type: Number,
        required: true
      },
      payableDays: {
        type: Number,
        required: true
      },
      absentDays: {
        type: Number,
        default: 0
      },
      
      // Detailed breakdown
      fullDays: { type: Number, default: 0 },
      lateDays: { type: Number, default: 0 },
      halfDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      unpaidLeaveDays: { type: Number, default: 0 },
      holidayDays: { type: Number, default: 0 },
      weekOffDays: { type: Number, default: 0 },
      
      // Deductions
      lateDeduction: { type: Number, default: 0 },
      halfDayDeduction: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 }
    },

    // ========== EARNINGS ==========
    earnings: [{
      componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent'
      },
      componentCode: {
        type: String
      },
      componentName: {
        type: String,
        required: true
      },
      calculationType: {
        type: String
      },
      baseAmount: {
        type: Number,
        // Amount before attendance calculation
      },
      amount: {
        type: Number,
        required: true
        // Final amount after attendance proration
      },
      isProrated: {
        type: Boolean,
        default: false
      }
    }],

    // ========== DEDUCTIONS ==========
    deductions: [{
      componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent'
      },
      componentCode: {
        type: String
      },
      componentName: {
        type: String,
        required: true
      },
      calculationType: {
        type: String
      },
      amount: {
        type: Number,
        required: true
      },
      isStatutory: {
        type: Boolean,
        default: false
      }
    }],

    // ========== ADJUSTMENTS ==========
    adjustments: [{
      type: {
        type: String,
        enum: ['ARREARS', 'ADVANCE', 'BONUS', 'INCENTIVE', 'PENALTY', 'LOAN_EMI', 'OTHER'],
        required: true
      },
      description: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      category: {
        type: String,
        enum: ['EARNING', 'DEDUCTION'],
        required: true
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      referenceId: {
        type: String
        // For loan EMI, bonus reference, etc.
      }
    }],

    // ========== LOAN DEDUCTIONS ==========
    loanDeductions: [{
      loanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan'
      },
      emiAmount: {
        type: Number,
        required: true
      },
      principalAmount: {
        type: Number
      },
      interestAmount: {
        type: Number
      },
      remainingAmount: {
        type: Number
      },
      emiNumber: {
        type: Number
      }
    }],

    // ========== SUMMARY ==========
    grossEarnings: {
      type: Number,
      required: true,
      default: 0
    },

    totalDeductions: {
      type: Number,
      required: true,
      default: 0
    },

    totalAdjustments: {
      type: Number,
      default: 0
    },

    netPayable: {
      type: Number,
      required: true,
      default: 0
    },

    // For legacy compatibility
    ctc: {
      type: Number,
      default: 0
    },

    // ========== STATUTORY CONTRIBUTIONS ==========
    statutoryContributions: {
      pf: {
        employee: { type: Number, default: 0 },
        employer: { type: Number, default: 0 },
        pension: { type: Number, default: 0 }
      },
      esi: {
        employee: { type: Number, default: 0 },
        employer: { type: Number, default: 0 }
      },
      pt: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      lwf: {
        employee: { type: Number, default: 0 },
        employer: { type: Number, default: 0 }
      }
    },

    // ========== STATUS & WORKFLOW ==========
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSED', 'ON_HOLD', 'CANCELLED'],
      default: 'DRAFT',
      index: true
    },

    // Approval workflow
    calculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },

    calculatedAt: {
      type: Date
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },

    approvedAt: {
      type: Date
    },

    approvalRemarks: {
      type: String
    },

    // Processing
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },

    processedAt: {
      type: Date
    },

    // ========== PAYMENT DETAILS ==========
    paymentDetails: {
      method: {
        type: String,
        enum: ['BANK_TRANSFER', 'CASH', 'CHEQUE', 'UPI'],
        default: 'BANK_TRANSFER'
      },
      
      bankAccountNumber: {
        type: String
      },

      ifscCode: {
        type: String
      },

      paymentDate: {
        type: Date
      },

      transactionReference: {
        type: String
      },

      utrNumber: {
        type: String
      },

      paymentStatus: {
        type: String,
        enum: ['PENDING', 'INITIATED', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
      }
    },

    // ========== SALARY SLIP ==========
    salarySlip: {
      generated: {
        type: Boolean,
        default: false
      },
      generatedAt: {
        type: Date
      },
      slipNumber: {
        type: String,
        unique: true,
        sparse: true
      },
      pdfPath: {
        type: String
      }
    },

    // ========== ADDITIONAL INFO ==========
    remarks: {
      type: String
    },

    isRevised: {
      type: Boolean,
      default: false
    },

    revisionReason: {
      type: String
    },

    previousSalaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salary'
    }
  },
  {
    timestamps: true
  }
);

// ========== INDEXES ==========
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ month: 1, year: 1 });
salarySchema.index({ status: 1 });
salarySchema.index({ 'paymentDetails.paymentStatus': 1 });
salarySchema.index({ createdAt: -1 });

// ========== VIRTUAL FIELDS ==========
salarySchema.virtual('periodName').get(function() {
  return `${this.month} ${this.year}`;
});

salarySchema.virtual('totalEarnings').get(function() {
  return this.earnings.reduce((sum, e) => sum + e.amount, 0);
});

salarySchema.virtual('totalStatutoryDeductions').get(function() {
  return this.deductions
    .filter(d => d.isStatutory)
    .reduce((sum, d) => sum + d.amount, 0);
});

// ========== PRE-SAVE MIDDLEWARE ==========
salarySchema.pre('save', function(next) {
  // Generate slip number if being approved
  if (this.isModified('status') && this.status === 'APPROVED' && !this.salarySlip.slipNumber) {
    const date = new Date();
    this.salarySlip.slipNumber = `SAL${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(this._id).slice(-6).toUpperCase()}`;
  }

  // Calculate totals
  this.grossEarnings = this.earnings.reduce((sum, e) => sum + e.amount, 0);
  this.totalDeductions = this.deductions.reduce((sum, d) => sum + d.amount, 0);
  
  const adjustmentSum = this.adjustments.reduce((sum, adj) => {
    return adj.category === 'EARNING' ? sum + adj.amount : sum - adj.amount;
  }, 0);
  
  this.totalAdjustments = adjustmentSum;
  this.netPayable = this.grossEarnings - this.totalDeductions + this.totalAdjustments;

  next();
});

// ========== INSTANCE METHODS ==========

// Add adjustment
salarySchema.methods.addAdjustment = function(adjustment) {
  this.adjustments.push(adjustment);
  return this.save();
};

// Approve salary
salarySchema.methods.approve = async function(approverId, remarks) {
  this.status = 'APPROVED';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.approvalRemarks = remarks;
  return await this.save();
};

// Process payment
salarySchema.methods.processPayment = async function(processorId, paymentDetails) {
  this.status = 'PROCESSED';
  this.processedBy = processorId;
  this.processedAt = new Date();
  
  if (paymentDetails) {
    this.paymentDetails = { ...this.paymentDetails, ...paymentDetails };
  }
  
  return await this.save();
};

// Cancel salary
salarySchema.methods.cancel = async function(cancelledBy, reason) {
  this.status = 'CANCELLED';
  this.remarks = `Cancelled by ${cancelledBy}: ${reason}`;
  return await this.save();
};

// Generate breakdown for display
salarySchema.methods.getBreakdown = function() {
  return {
    period: this.periodName,
    attendance: this.attendanceData,
    earnings: this.earnings,
    deductions: this.deductions,
    adjustments: this.adjustments,
    statutory: this.statutoryContributions,
    summary: {
      grossEarnings: this.grossEarnings,
      totalDeductions: this.totalDeductions,
      totalAdjustments: this.totalAdjustments,
      netPayable: this.netPayable
    },
    payment: this.paymentDetails,
    status: this.status
  };
};

// ========== STATIC METHODS ==========

// Get salary for employee and period
salarySchema.statics.getSalaryByPeriod = async function(employeeId, month, year) {
  return await this.findOne({ employeeId, month, year })
    .populate('employeeId', 'firstName lastName email eId')
    .populate('salaryStructureId');
};

// Get all salaries for a period
salarySchema.statics.getSalariesByPeriod = async function(month, year, status = null) {
  const query = { month, year };
  if (status) query.status = status;
  
  return await this.find(query)
    .populate('employeeId', 'firstName lastName email eId branch')
    .sort({ 'employeeId.firstName': 1 });
};

// Get pending approvals
salarySchema.statics.getPendingApprovals = async function() {
  return await this.find({ status: 'PENDING_APPROVAL' })
    .populate('employeeId', 'firstName lastName email eId')
    .sort({ createdAt: 1 });
};

// Get statistics for a period
salarySchema.statics.getPeriodStatistics = async function(month, year) {
  const salaries = await this.find({ month, year });
  
  return {
    totalEmployees: salaries.length,
    totalGrossEarnings: salaries.reduce((sum, s) => sum + s.grossEarnings, 0),
    totalDeductions: salaries.reduce((sum, s) => sum + s.totalDeductions, 0),
    totalNetPayable: salaries.reduce((sum, s) => sum + s.netPayable, 0),
    statusBreakdown: {
      draft: salaries.filter(s => s.status === 'DRAFT').length,
      pendingApproval: salaries.filter(s => s.status === 'PENDING_APPROVAL').length,
      approved: salaries.filter(s => s.status === 'APPROVED').length,
      processed: salaries.filter(s => s.status === 'PROCESSED').length
    }
  };
};

const Salary = mongoose.model("Salary", salarySchema, "salaries");

export default Salary;
