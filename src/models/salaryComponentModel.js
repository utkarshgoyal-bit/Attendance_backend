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
      unique: true,  // ✅ ONLY UNIQUE HERE - NOT in index()
      uppercase: true,
      trim: true
    },

    // Component category
    category: {
      type: String,
      enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'],
      required: [true, 'Category is required']
    },

    // Component type
    type: {
      type: String,
      enum: ['FIXED', 'VARIABLE', 'PERCENTAGE', 'FORMULA'],
      required: [true, 'Type is required']
    },

    // Calculation method
    calculationType: {
      type: String,
      enum: [
        'FLAT',
        'PERCENTAGE_OF_BASE',
        'PERCENTAGE_OF_GROSS',
        'PERCENTAGE_OF_CTC',
        'CUSTOM_FORMULA'
      ],
      default: 'FLAT'
    },

    // For FIXED or PERCENTAGE type
    value: {
      type: Number,
      default: 0,
      min: 0
    },

    // For FORMULA type
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

    // Is statutory component (PF, ESI, PT)?
    isStatutory: {
      type: Boolean,
      default: false
    },

    // Affects attendance-based calculation
    isAttendanceBased: {
      type: Boolean,
      default: true
    },

    // Display order
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
    }],

    // Thresholds
    minThreshold: {
      type: Number,
      default: 0
    },

    maxThreshold: {
      type: Number
    },

    // Description
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

// ✅ INDEXES - NO DUPLICATE CODE INDEX
salaryComponentSchema.index({ orgId: 1, isActive: 1 });
salaryComponentSchema.index({ category: 1 });
// ❌ REMOVED: salaryComponentSchema.index({ code: 1 }, { unique: true });
// Code already has unique:true in schema definition above

// Virtuals
salaryComponentSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.code})`;
});

// Methods
salaryComponentSchema.methods.validateFormula = function() {
  if (this.type === 'FORMULA' && !this.formula) {
    throw new Error('Formula is required for FORMULA type components');
  }
  return true;
};

// Static methods
salaryComponentSchema.statics.getActiveComponents = async function(orgId, category = null) {
  const query = { orgId, isActive: true };
  if (category) {
    query.category = category;
  }
  return await this.find(query).sort({ displayOrder: 1 });
};

salaryComponentSchema.statics.getEarningComponents = async function(orgId) {
  return await this.getActiveComponents(orgId, 'EARNING');
};

salaryComponentSchema.statics.getDeductionComponents = async function(orgId) {
  return await this.getActiveComponents(orgId, 'DEDUCTION');
};

const SalaryComponent = mongoose.model("SalaryComponent", salaryComponentSchema, "salarycomponents");

export default SalaryComponent;