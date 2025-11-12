import mongoose from "mongoose";

const organizationConfigSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'Organization'
    },

    // ========== ATTENDANCE TIMING RULES ==========
    attendanceTiming: {
      fullDayBefore: {
        type: String,
        default: "10:00",
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      lateBefore: {
        type: String,
        default: "11:00",
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      halfDayBefore: {
        type: String,
        default: "14:00",
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      }
    },

    // ========== DEDUCTION RULES ==========
    deductions: {
      lateRule: {
        enabled: { type: Boolean, default: true },
        count: { type: Number, default: 3, min: 1 },
        equals: { type: Number, default: 1, min: 0 },
        description: { type: String, default: "3 LATE entries = 1 ABSENT" }
      },
      halfDayRule: {
        enabled: { type: Boolean, default: true },
        count: { type: Number, default: 2, min: 1 },
        equals: { type: Number, default: 1, min: 0 },
        description: { type: String, default: "2 HALF_DAY entries = 1 ABSENT" }
      }
    },

    // ========== LEAVE POLICY ==========
    leavePolicy: {
      casualLeave: { type: Number, default: 12, min: 0 },
      sickLeave: { type: Number, default: 12, min: 0 },
      paidLeave: { type: Number, default: 24, min: 0 },
      maternityLeave: { type: Number, default: 180, min: 0 },
      paternityLeave: { type: Number, default: 15, min: 0 },
      unpaidLeave: { type: Boolean, default: true },
      carryForward: {
        enabled: { type: Boolean, default: false },
        maxDays: { type: Number, default: 0, min: 0 }
      }
    },

    // ========== WORKING DAYS ==========
    workingDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: false },
      sunday: { type: Boolean, default: false }
    },

    // ========== QR CODE SETTINGS ==========
    qrCodeSettings: {
      expiryMinutes: { type: Number, default: 5, min: 1, max: 60 },
      autoRefresh: { type: Boolean, default: true },
      allowMultipleBranches: { type: Boolean, default: true }
    },

    // ========== APPROVAL WORKFLOW ==========
    approvalWorkflow: {
      autoApprove: { type: Boolean, default: false },
      requiresManagerApproval: { type: Boolean, default: true },
      notifyOnPending: { type: Boolean, default: true },
      notifyOnApproval: { type: Boolean, default: true }
    },

    // ========== OVERTIME POLICY ==========
    overtimePolicy: {
      enabled: { type: Boolean, default: false },
      rateMultiplier: { type: Number, default: 1.5, min: 1 },
      minimumHours: { type: Number, default: 1, min: 0.5 },
      requiresApproval: { type: Boolean, default: true }
    },

    // ========== GRACE PERIOD ==========
    gracePeriod: {
      enabled: { type: Boolean, default: true },
      minutes: { type: Number, default: 10, min: 0, max: 60 },
      description: { type: String, default: "10 minutes grace period for late arrivals" }
    },

    // ========== NOTIFICATION SETTINGS ==========
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      dailyReport: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: true },
      monthlyReport: { type: Boolean, default: true }
    },

    // ========== GENERAL SETTINGS ==========
    settings: {
      fiscalYearStart: { type: String, default: "01-04" }, // DD-MM format
      probationPeriodDays: { type: Number, default: 90, min: 0 },
      retirementAge: { type: Number, default: 60, min: 18 },
      timezone: { type: String, default: "Asia/Kolkata" },
      currency: { type: String, default: "INR" },
      dateFormat: { type: String, default: "DD-MM-YYYY" }
    },

    // Track configuration changes
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// ========== INDEXES ==========
organizationConfigSchema.index({ orgId: 1 });
organizationConfigSchema.index({ isActive: 1 });

// ========== METHODS ==========

// Get attendance status based on check-in time
organizationConfigSchema.methods.getAttendanceStatus = function(checkInTime) {
  const checkIn = new Date(checkInTime);
  const hours = checkIn.getHours();
  const minutes = checkIn.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Parse configured times
  const [fullHour, fullMin] = this.attendanceTiming.fullDayBefore.split(':').map(Number);
  const [lateHour, lateMin] = this.attendanceTiming.lateBefore.split(':').map(Number);
  const [halfHour, halfMin] = this.attendanceTiming.halfDayBefore.split(':').map(Number);

  const fullDayMinutes = fullHour * 60 + fullMin;
  const lateMinutes = lateHour * 60 + lateMin;
  const halfDayMinutes = halfHour * 60 + halfMin;

  // Apply grace period if enabled
  const graceMinutes = this.gracePeriod.enabled ? this.gracePeriod.minutes : 0;
  const effectiveFullDayMinutes = fullDayMinutes + graceMinutes;

  if (totalMinutes < effectiveFullDayMinutes) {
    return 'FULL_DAY';
  } else if (totalMinutes < lateMinutes) {
    return 'LATE';
  } else if (totalMinutes < halfDayMinutes) {
    return 'HALF_DAY';
  } else {
    return 'ABSENT';
  }
};

// Calculate attendance deductions
organizationConfigSchema.methods.calculateDeductions = function(lateCount, halfDayCount) {
  let deductions = 0;

  // Late deductions
  if (this.deductions.lateRule.enabled) {
    deductions += Math.floor(lateCount / this.deductions.lateRule.count) * this.deductions.lateRule.equals;
  }

  // Half-day deductions
  if (this.deductions.halfDayRule.enabled) {
    deductions += Math.floor(halfDayCount / this.deductions.halfDayRule.count) * this.deductions.halfDayRule.equals;
  }

  return deductions;
};

// Check if a day is a working day
organizationConfigSchema.methods.isWorkingDay = function(date) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[new Date(date).getDay()];
  return this.workingDays[dayName];
};

// Get available leave balance
organizationConfigSchema.methods.getLeaveBalance = function(leaveType) {
  return this.leavePolicy[leaveType] || 0;
};

// ========== STATIC METHODS ==========

// Get or create default config for organization
organizationConfigSchema.statics.getOrCreateConfig = async function(orgId) {
  let config = await this.findOne({ orgId, isActive: true });

  if (!config) {
    config = await this.create({ orgId });
  }

  return config;
};

// Update config settings
organizationConfigSchema.statics.updateConfig = async function(orgId, updates, updatedBy) {
  return await this.findOneAndUpdate(
    { orgId },
    { ...updates, lastUpdatedBy: updatedBy },
    { new: true, upsert: true, runValidators: true }
  );
};

const OrganizationConfig = mongoose.model("OrganizationConfig", organizationConfigSchema, "organizationconfig");

export default OrganizationConfig;
