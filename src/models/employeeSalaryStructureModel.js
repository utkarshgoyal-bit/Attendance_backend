import mongoose from "mongoose";

const employeeSalaryStructureSchema = new mongoose.Schema(
  {
    // Employee reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
      index: true
    },

    // Effective date range
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required']
    },

    effectiveTo: {
      type: Date,
      // null means currently active
    },

    // CTC (Cost to Company)
    ctc: {
      type: Number,
      required: [true, 'CTC is required'],
      min: 0
    },

    // Annual CTC breakdown
    annualCTC: {
      type: Number,
      // For yearly calculations
    },

    // Monthly CTC
    monthlyCTC: {
      type: Number,
      // CTC / 12
    },

    // Salary components assigned to this employee
    components: [{
      componentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent',
        required: true
      },
      
      // Component value (amount or percentage)
      value: {
        type: Number,
        required: true,
        min: 0
      },

      // Is this value manually overridden?
      isOverridden: {
        type: Boolean,
        default: false
      },

      // Override reason
      overrideReason: {
        type: String
      },

      // Annual amount for this component
      annualAmount: {
        type: Number
      },

      // Monthly amount for this component
      monthlyAmount: {
        type: Number
      }
    }],

    // Breakdown
    totalEarnings: {
      type: Number,
      default: 0
    },

    totalDeductions: {
      type: Number,
      default: 0
    },

    netMonthlySalary: {
      type: Number,
      default: 0
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Revision tracking
    revisionNumber: {
      type: Number,
      default: 1
    },

    previousStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeSalaryStructure'
      // Link to previous salary structure
    },

    revisionReason: {
      type: String,
      enum: [
        'NEW_JOINING',
        'PROMOTION',
        'ANNUAL_INCREMENT',
        'MARKET_CORRECTION',
        'PERFORMANCE_BONUS',
        'ROLE_CHANGE',
        'LOCATION_CHANGE',
        'OTHER'
      ]
    },

    revisionRemarks: {
      type: String
    },

    // Approval workflow
    approvalStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'DRAFT'
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },

    approvedAt: {
      type: Date
    },

    rejectionReason: {
      type: String
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
employeeSalaryStructureSchema.index({ employeeId: 1, isActive: 1 });
employeeSalaryStructureSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
employeeSalaryStructureSchema.index({ approvalStatus: 1 });

// Compound index for finding active structure
employeeSalaryStructureSchema.index(
  { employeeId: 1, isActive: 1, effectiveFrom: -1 },
  { name: 'active_structure_lookup' }
);

// Pre-save middleware to calculate breakdowns
employeeSalaryStructureSchema.pre('save', function(next) {
  // Calculate monthly CTC
  if (this.annualCTC) {
    this.monthlyCTC = Math.round(this.annualCTC / 12);
  } else if (this.ctc) {
    this.monthlyCTC = this.ctc;
    this.annualCTC = this.ctc * 12;
  }

  // Calculate total earnings and deductions
  // Note: Detailed calculation happens in the service layer
  
  next();
});

// Method to calculate component breakdown
employeeSalaryStructureSchema.methods.calculateBreakdown = async function() {
  const SalaryComponent = mongoose.model('SalaryComponent');
  
  let totalEarnings = 0;
  let totalDeductions = 0;

  for (let comp of this.components) {
    const component = await SalaryComponent.findById(comp.componentId);
    
    if (!component) continue;

    // Calculate monthly amount based on component type
    let monthlyAmount = comp.value;

    if (component.calculationType === 'PERCENTAGE_OF_CTC') {
      monthlyAmount = Math.round((this.monthlyCTC * comp.value) / 100);
    }

    comp.monthlyAmount = monthlyAmount;
    comp.annualAmount = monthlyAmount * 12;

    // Add to totals
    if (component.category === 'EARNING') {
      totalEarnings += monthlyAmount;
    } else if (component.category === 'DEDUCTION') {
      totalDeductions += monthlyAmount;
    }
  }

  this.totalEarnings = totalEarnings;
  this.totalDeductions = totalDeductions;
  this.netMonthlySalary = totalEarnings - totalDeductions;

  return {
    totalEarnings,
    totalDeductions,
    netMonthlySalary: this.netMonthlySalary
  };
};

// Method to approve structure
employeeSalaryStructureSchema.methods.approve = async function(approverId) {
  this.approvalStatus = 'APPROVED';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  await this.save();
};

// Method to reject structure
employeeSalaryStructureSchema.methods.reject = async function(approverId, reason) {
  this.approvalStatus = 'REJECTED';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
};

// Static method to get active structure for an employee
employeeSalaryStructureSchema.statics.getActiveStructure = async function(employeeId, asOfDate = new Date()) {
  return await this.findOne({
    employeeId,
    isActive: true,
    approvalStatus: 'APPROVED',
    effectiveFrom: { $lte: asOfDate },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: asOfDate } }
    ]
  })
  .populate('components.componentId')
  .sort({ effectiveFrom: -1 });
};

// Static method to get structure history
employeeSalaryStructureSchema.statics.getHistory = async function(employeeId) {
  return await this.find({ employeeId })
    .populate('components.componentId')
    .populate('approvedBy', 'firstName lastName')
    .sort({ effectiveFrom: -1 });
};

// Static method to deactivate previous structures
employeeSalaryStructureSchema.statics.deactivatePrevious = async function(employeeId, effectiveFrom) {
  return await this.updateMany(
    {
      employeeId,
      isActive: true,
      effectiveFrom: { $lt: effectiveFrom }
    },
    {
      $set: {
        isActive: false,
        effectiveTo: new Date(effectiveFrom.getTime() - 1)
      }
    }
  );
};

const EmployeeSalaryStructure = mongoose.model(
  "EmployeeSalaryStructure",
  employeeSalaryStructureSchema,
  "employeesalarystructures"
);

export default EmployeeSalaryStructure;
