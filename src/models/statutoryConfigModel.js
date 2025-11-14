import mongoose from "mongoose";

const statutoryConfigSchema = new mongoose.Schema(
  {
    // Organization reference
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true
    },

    // ========== PROVIDENT FUND (PF) CONFIGURATION ==========
    pf: {
      enabled: {
        type: Boolean,
        default: true
      },

      // Support for multiple slabs
      slabs: [{
        name: {
          type: String,
          default: 'Standard'
        },
        minSalary: {
          type: Number,
          required: true,
          default: 0
        },
        maxSalary: {
          type: Number,
          required: true,
          default: 15000
        },
        employeeContribution: {
          type: Number,
          required: true,
          default: 12,
          // Percentage
        },
        employerContribution: {
          type: Number,
          required: true,
          default: 12,
          // Percentage
        },
        pensionContribution: {
          type: Number,
          default: 8.33,
          // Percentage - from employer's contribution
        }
      }],

      // Salary ceiling for PF calculation
      ceiling: {
        type: Number,
        default: 15000,
        // Max salary on which PF is calculated
      },

      // Applicable states (if state-specific rules)
      applicableStates: [{
        type: String
      }],

      // Is PF mandatory for all employees?
      isMandatory: {
        type: Boolean,
        default: true
      },

      // Minimum employees for PF applicability
      minEmployeesForApplicability: {
        type: Number,
        default: 20
      }
    },

    // ========== EMPLOYEE STATE INSURANCE (ESI) CONFIGURATION ==========
    esi: {
      enabled: {
        type: Boolean,
        default: true
      },

      slabs: [{
        name: {
          type: String,
          default: 'Standard'
        },
        minSalary: {
          type: Number,
          required: true,
          default: 0
        },
        maxSalary: {
          type: Number,
          required: true,
          default: 21000
        },
        employeeContribution: {
          type: Number,
          required: true,
          default: 0.75,
          // Percentage
        },
        employerContribution: {
          type: Number,
          required: true,
          default: 3.25,
          // Percentage
        }
      }],

      // Salary ceiling for ESI
      ceiling: {
        type: Number,
        default: 21000
      },

      applicableStates: [{
        type: String
      }],

      isMandatory: {
        type: Boolean,
        default: true
      },

      minEmployeesForApplicability: {
        type: Number,
        default: 10
      }
    },

    // ========== PROFESSIONAL TAX (PT) - STATE SPECIFIC ==========
    professionalTax: {
      enabled: {
        type: Boolean,
        default: false
      },

      state: {
        type: String,
        enum: [
          'ANDHRA_PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH', 
          'GUJARAT', 'JHARKHAND', 'KARNATAKA', 'KERALA', 
          'MADHYA_PRADESH', 'MAHARASHTRA', 'MEGHALAYA', 'ODISHA',
          'SIKKIM', 'TAMIL_NADU', 'TELANGANA', 'TRIPURA', 
          'WEST_BENGAL', 'PUDUCHERRY'
        ]
        // Only applicable states
      },

      slabs: [{
        minSalary: {
          type: Number,
          required: true
        },
        maxSalary: {
          type: Number
          // null means no upper limit
        },
        taxAmount: {
          type: Number,
          required: true
          // Fixed amount per month
        },
        description: {
          type: String
        }
      }],

      // Annual maximum PT
      annualMaximum: {
        type: Number,
        default: 2500
        // As per current laws, max PT per year is ₹2500
      },

      // Deduct in specific month (usually February)
      deductionMonth: {
        type: String,
        enum: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
               'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
        default: 'FEBRUARY'
      }
    },

    // ========== TAX DEDUCTED AT SOURCE (TDS) ==========
    tds: {
      enabled: {
        type: Boolean,
        default: false
      },

      financialYear: {
        type: String,
        required: true,
        default: '2024-25'
      },

      // Tax regime
      regime: {
        type: String,
        enum: ['OLD', 'NEW'],
        default: 'NEW'
      },

      // Income tax slabs
      slabs: [{
        minIncome: {
          type: Number,
          required: true
        },
        maxIncome: {
          type: Number
          // null means no upper limit
        },
        rate: {
          type: Number,
          required: true
          // Percentage
        },
        description: {
          type: String
        }
      }],

      // Surcharge applicable
      surcharge: {
        enabled: {
          type: Boolean,
          default: false
        },
        slabs: [{
          minIncome: {
            type: Number,
            required: true
          },
          rate: {
            type: Number,
            required: true
          }
        }]
      },

      // Health and Education Cess
      cess: {
        type: Number,
        default: 4,
        // Percentage on (tax + surcharge)
      },

      // Standard deduction
      standardDeduction: {
        enabled: {
          type: Boolean,
          default: true
        },
        amount: {
          type: Number,
          default: 50000
        }
      },

      // Section 80C deductions
      section80C: {
        enabled: {
          type: Boolean,
          default: true
        },
        maxLimit: {
          type: Number,
          default: 150000
        }
      },

      // HRA exemption
      hraExemption: {
        enabled: {
          type: Boolean,
          default: true
        }
      }
    },

    // ========== LABOUR WELFARE FUND (LWF) ==========
    lwf: {
      enabled: {
        type: Boolean,
        default: false
      },

      state: {
        type: String
      },

      employeeContribution: {
        type: Number,
        default: 0
      },

      employerContribution: {
        type: Number,
        default: 0
      },

      frequency: {
        type: String,
        enum: ['MONTHLY', 'ANNUAL', 'HALF_YEARLY'],
        default: 'ANNUAL'
      },

      deductionMonth: {
        type: String
      }
    },

    // ========== GRATUITY CONFIGURATION ==========
    gratuity: {
      enabled: {
        type: Boolean,
        default: true
      },

      minServiceYears: {
        type: Number,
        default: 5,
        // Minimum service years for gratuity eligibility
      },

      calculationFormula: {
        type: String,
        default: '(Last drawn salary × 15) / 26 × Years of service'
      },

      maxAmount: {
        type: Number,
        default: 2000000,
        // Current max gratuity amount is ₹20 lakhs
      }
    },

    // Metadata
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },

    effectiveFrom: {
      type: Date,
      default: Date.now
    },

    remarks: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes
statutoryConfigSchema.index({ orgId: 1 }, { unique: true });

// ========== INSTANCE METHODS ==========

// Calculate PF for a given salary
statutoryConfigSchema.methods.calculatePF = function(monthlySalary) {
  if (!this.pf.enabled) return { employee: 0, employer: 0, pension: 0 };

  // Find applicable slab
  const slab = this.pf.slabs.find(s => 
    monthlySalary >= s.minSalary && monthlySalary <= s.maxSalary
  );

  if (!slab) return { employee: 0, employer: 0, pension: 0 };

  // Apply ceiling
  const applicableSalary = Math.min(monthlySalary, this.pf.ceiling);

  const employeePF = Math.round((applicableSalary * slab.employeeContribution) / 100);
  const employerPF = Math.round((applicableSalary * slab.employerContribution) / 100);
  const pension = Math.round((applicableSalary * slab.pensionContribution) / 100);

  return {
    employee: employeePF,
    employer: employerPF - pension,
    pension: pension,
    total: employeePF + employerPF,
    applicableSalary
  };
};

// Calculate ESI for a given salary
statutoryConfigSchema.methods.calculateESI = function(monthlySalary) {
  if (!this.esi.enabled) return { employee: 0, employer: 0 };

  // Check if salary exceeds ceiling
  if (monthlySalary > this.esi.ceiling) {
    return { employee: 0, employer: 0 };
  }

  // Find applicable slab
  const slab = this.esi.slabs.find(s => 
    monthlySalary >= s.minSalary && monthlySalary <= s.maxSalary
  );

  if (!slab) return { employee: 0, employer: 0 };

  const employeeESI = Math.round((monthlySalary * slab.employeeContribution) / 100);
  const employerESI = Math.round((monthlySalary * slab.employerContribution) / 100);

  return {
    employee: employeeESI,
    employer: employerESI,
    total: employeeESI + employerESI,
    applicableSalary: monthlySalary
  };
};

// Calculate Professional Tax
statutoryConfigSchema.methods.calculateProfessionalTax = function(monthlySalary, month) {
  if (!this.professionalTax.enabled) return 0;

  // Find applicable slab
  const slab = this.professionalTax.slabs.find(s => {
    if (s.maxSalary) {
      return monthlySalary >= s.minSalary && monthlySalary <= s.maxSalary;
    } else {
      return monthlySalary >= s.minSalary;
    }
  });

  if (!slab) return 0;

  // Check if this is the deduction month for annual PT
  if (this.professionalTax.deductionMonth === month) {
    return slab.taxAmount;
  }

  // For monthly PT
  return slab.taxAmount;
};

// ========== STATIC METHODS ==========

// Get or create config
statutoryConfigSchema.statics.getOrCreateConfig = async function(orgId) {
  let config = await this.findOne({ orgId });

  if (!config) {
    // Create default config with Indian statutory defaults
    config = await this.create({
      orgId,
      pf: {
        enabled: true,
        slabs: [{
          name: 'Standard',
          minSalary: 0,
          maxSalary: 15000,
          employeeContribution: 12,
          employerContribution: 12,
          pensionContribution: 8.33
        }],
        ceiling: 15000
      },
      esi: {
        enabled: true,
        slabs: [{
          name: 'Standard',
          minSalary: 0,
          maxSalary: 21000,
          employeeContribution: 0.75,
          employerContribution: 3.25
        }],
        ceiling: 21000
      },
      professionalTax: {
        enabled: false
      },
      tds: {
        enabled: false,
        financialYear: '2024-25',
        regime: 'NEW',
        cess: 4
      }
    });
  }

  return config;
};

const StatutoryConfig = mongoose.model(
  "StatutoryConfig",
  statutoryConfigSchema,
  "statutoryconfigs"
);

export default StatutoryConfig;
