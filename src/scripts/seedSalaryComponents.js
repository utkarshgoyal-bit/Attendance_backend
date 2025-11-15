import mongoose from "mongoose";

const salaryComponentSchema = new mongoose.Schema(
  {
    // Organization reference
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

    // Component identification
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true
    },

    code: {
      type: String,
      required: [true, 'Component code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g., "BASE", "HRA", "TRANSPORT", "BONUS"
    },

    // Component category
    category: {
      type: String,
      enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'],
      required: [true, 'Category is required']
    },

    // Component type determines how it's calculated
    type: {
      type: String,
      enum: ['FIXED', 'VARIABLE', 'PERCENTAGE', 'FORMULA'],
      required: [true, 'Type is required']
    },

    // Calculation method
    calculationType: {
      type: String,
      enum: [
        'FLAT',                    // Fixed amount
        'PERCENTAGE_OF_BASE',      // % of base salary
        'PERCENTAGE_OF_GROSS',     // % of gross earnings
        'PERCENTAGE_OF_CTC',       // % of CTC
        'CUSTOM_FORMULA'           // Custom formula
      ],
      default: 'FLAT'
    },

    // For FIXED type or PERCENTAGE type
    value: {
      type: Number,
      default: 0,
      min: 0
    },

    // For FORMULA type - custom calculation formula
    // Example: "(BASE * 0.4) + (GROSS * 0.1)"
    formula: {
      type: String,
      trim: true
    },

    // Active status
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    // Tax configuration
    isTaxable: {
      type: Boolean,
      default: true
    },

    // Is this a statutory component (PF, ESI, PT)?
    isStatutory: {
      type: Boolean,
      default: false
    },

    // Affects attendance-based calculation
    isAttendanceBased: {
      type: Boolean,
      default: true,
      // If true, amount is prorated based on attendance
      // If false, full amount is given regardless of attendance
    },

    // Display order in salary slip
    displayOrder: {
      type: Number,
      default: 0
    },

    // Applicability
    applicableRoles: [{
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN', 'ALL']
    }],

    applicableBranches: [{
      type: String
      // Branch IDs or "ALL"
    }],

    // Threshold configuration
    minThreshold: {
      type: Number,
      default: 0,
      // Minimum salary for this component to apply
    },

    maxThreshold: {
      type: Number,
      // Maximum salary for this component to apply
    },

    // Description for documentation
    description: {
      type: String,
      trim: true
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
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
salaryComponentSchema.index({ orgId: 1, isActive: 1 });
salaryComponentSchema.index({ code: 1 }, { unique: true });
salaryComponentSchema.index({ category: 1 });

// Virtual for formatted name
salaryComponentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Method to validate formula syntax
salaryComponentSchema.methods.validateFormula = function() {
  if (this.type === 'FORMULA' && !this.formula) {
    throw new Error('Formula is required for FORMULA type components');
  }
  return true;
};

// Static method to get all active components for an organization
salaryComponentSchema.statics.getActiveComponents = async function(orgId, category = null) {
  const query = { orgId, isActive: true };
  if (category) {
    query.category = category;
  }
  return await this.find(query).sort({ displayOrder: 1 });
};

// Static method to get earning components
salaryComponentSchema.statics.getEarningComponents = async function(orgId) {
  return await this.getActiveComponents(orgId, 'EARNING');
};

// Static method to get deduction components
salaryComponentSchema.statics.getDeductionComponents = async function(orgId) {
  return await this.getActiveComponents(orgId, 'DEDUCTION');
};

const SalaryComponent = mongoose.model("SalaryComponent", salaryComponentSchema, "salarycomponents");

export default SalaryComponent;
