import mongoose from "mongoose";

const salaryComponentSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },

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
      trim: true
    },

    category: {
      type: String,
      enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'],
      required: [true, 'Category is required']
    },

    type: {
      type: String,
      enum: ['FIXED', 'VARIABLE', 'PERCENTAGE', 'FORMULA'],
      required: [true, 'Type is required']
    },

    calculationType: {
      type: String,
      enum: ['FLAT', 'PERCENTAGE_OF_BASE', 'PERCENTAGE_OF_GROSS', 'PERCENTAGE_OF_CTC', 'CUSTOM_FORMULA'],
      default: 'FLAT'
    },

    value: {
      type: Number,
      default: 0,
      min: 0
    },

    formula: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isTaxable: {
      type: Boolean,
      default: true
    },

    isStatutory: {
      type: Boolean,
      default: false
    },

    isAttendanceBased: {
      type: Boolean,
      default: true
    },

    displayOrder: {
      type: Number,
      default: 0
    },

    applicableRoles: [{
      type: String,
      enum: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN', 'ALL']
    }],

    applicableBranches: [{
      type: String
    }],

    minThreshold: {
      type: Number,
      default: 0
    },

    maxThreshold: {
      type: Number
    },

    description: {
      type: String,
      trim: true
    },

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

// Indexes - NO DUPLICATE!
salaryComponentSchema.index({ orgId: 1, isActive: 1 });
salaryComponentSchema.index({ category: 1 });

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