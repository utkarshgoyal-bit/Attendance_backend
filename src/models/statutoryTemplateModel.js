import mongoose from "mongoose";

const statutoryTemplateSchema = new mongoose.Schema(
  {
    // Basic Info
    templateName: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION'],
      required: true
    },
    type: {
      type: String,
      enum: ['STATUTORY', 'NON_STATUTORY'],
      default: 'STATUTORY'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true
    },

    // Calculation Method
    calculationMethod: {
      type: String,
      enum: ['FIXED_AMOUNT', 'PERCENTAGE', 'SLAB_BASED', 'FORMULA'],
      required: true
    },

    // For FIXED_AMOUNT
    fixedAmount: {
      type: Number,
      min: 0
    },

    // For PERCENTAGE
    percentageConfig: {
      employeePercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      employerPercentage: {
        type: Number,
        min: 0,
        max: 100
      },
      calculateOn: {
        type: String,
        enum: ['BASIC_SALARY', 'GROSS_SALARY', 'CTC', 'SPECIFIC_COMPONENT']
      },
      specificComponentCode: String // If calculateOn is SPECIFIC_COMPONENT
    },

    // For SLAB_BASED
    slabs: [{
      minAmount: {
        type: Number,
        required: true
      },
      maxAmount: {
        type: Number,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      isPercentage: {
        type: Boolean,
        default: false
      }
    }],

    // For FORMULA
    formula: {
      type: String,
      trim: true
    },

    // Ceiling/Threshold
    hasCeiling: {
      type: Boolean,
      default: false
    },
    ceilingAmount: {
      type: Number,
      min: 0
    },

    hasMinThreshold: {
      type: Boolean,
      default: false
    },
    minThreshold: {
      type: Number,
      min: 0
    },

    hasMaxThreshold: {
      type: Boolean,
      default: false
    },
    maxThreshold: {
      type: Number,
      min: 0
    },

    // Attendance Behavior
    isAttendanceBased: {
      type: Boolean,
      default: true
    },
    attendanceProration: {
      type: String,
      enum: ['FULL', 'HALF', 'NONE'],
      default: 'FULL'
    },

    // Applicability Rules
    applicability: {
      mandatory: {
        type: Boolean,
        default: true
      },
      
      // Conditional rules
      conditions: [{
        field: {
          type: String,
          enum: ['GROSS_SALARY', 'BASIC_SALARY', 'CTC', 'EMPLOYEE_ROLE', 'BRANCH', 'STATE']
        },
        operator: {
          type: String,
          enum: ['>', '<', '>=', '<=', '==', '!=', 'IN', 'NOT_IN']
        },
        value: mongoose.Schema.Types.Mixed // Can be number, string, or array
      }]
    },

    // State/Region Specific
    isStateSpecific: {
      type: Boolean,
      default: false
    },
    stateConfigs: {
      type: Map,
      of: {
        slabs: [{
          minAmount: Number,
          maxAmount: Number,
          value: Number
        }],
        fixedAmount: Number,
        isActive: Boolean
      }
    },

    // Employer Contribution
    hasEmployerContribution: {
      type: Boolean,
      default: false
    },
    employerConfig: {
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      split: [{
        name: String, // e.g., "PF", "Pension"
        percentage: Number
      }],
      calculateOn: {
        type: String,
        enum: ['SAME_AS_EMPLOYEE', 'BASIC_SALARY', 'GROSS_SALARY', 'CUSTOM']
      }
    },

    // Display & Sorting
    displayOrder: {
      type: Number,
      default: 0
    },

    // Audit
    orgId: {
      type: String,
      required: true,
      index: true
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

// Indexes
statutoryTemplateSchema.index({ orgId: 1, isActive: 1 });
statutoryTemplateSchema.index({ code: 1 }, { unique: true });
statutoryTemplateSchema.index({ category: 1, type: 1 });

// Validation Methods
statutoryTemplateSchema.methods.validate = function() {
  // Validate based on calculation method
  if (this.calculationMethod === 'FIXED_AMOUNT' && !this.fixedAmount) {
    throw new Error('Fixed amount is required for FIXED_AMOUNT calculation method');
  }
  
  if (this.calculationMethod === 'PERCENTAGE' && !this.percentageConfig) {
    throw new Error('Percentage config is required for PERCENTAGE calculation method');
  }
  
  if (this.calculationMethod === 'SLAB_BASED' && (!this.slabs || this.slabs.length === 0)) {
    throw new Error('Slabs are required for SLAB_BASED calculation method');
  }
  
  if (this.calculationMethod === 'FORMULA' && !this.formula) {
    throw new Error('Formula is required for FORMULA calculation method');
  }
  
  return true;
};

// Static Methods
statutoryTemplateSchema.statics.getActiveTemplates = async function(orgId, category = null) {
  const query = { orgId, isActive: true };
  if (category) query.category = category;
  return await this.find(query).sort({ displayOrder: 1, templateName: 1 });
};

const StatutoryTemplate = mongoose.model(
  "StatutoryTemplate",
  statutoryTemplateSchema,
  "statutory_templates"
);

export default StatutoryTemplate;
