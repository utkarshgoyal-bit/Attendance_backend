import mongoose from "mongoose";

// ========== DYNAMIC FIELD SCHEMA ==========
const dynamicFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['time', 'number', 'toggle', 'text', 'select'],
    required: true 
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  options: [{ label: String, value: String }], // For select type
  unit: { type: String }, // For number type (e.g., "minutes", "hours")
  min: { type: Number },  // For number type
  max: { type: Number },  // For number type
  required: { type: Boolean, default: false },
  editable: { type: Boolean, default: true },
  deletable: { type: Boolean, default: true }, // false for core fields
  description: { type: String },
  order: { type: Number, default: 0 }
}, { _id: true });

// ========== MAIN CONFIG SCHEMA ==========
const organizationConfigSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: 'Organization'
    },

    // ========== ATTENDANCE SETTINGS (DYNAMIC) ==========
    attendanceSettings: {
      enabled: { type: Boolean, default: true },
      fields: [dynamicFieldSchema]
    },

    // ========== DEDUCTION RULES (DYNAMIC) ==========
    deductionSettings: {
      enabled: { type: Boolean, default: true },
      fields: [dynamicFieldSchema]
    },

    // ========== LEAVE POLICY (DYNAMIC) ==========
    leaveSettings: {
      enabled: { type: Boolean, default: true },
      fields: [dynamicFieldSchema]
    },

    // ========== WORKING DAYS (DYNAMIC) ==========
    workingDaysSettings: {
      enabled: { type: Boolean, default: true },
      fields: [dynamicFieldSchema]
    },

    // ========== QR & ATTENDANCE MODES (DYNAMIC) ==========
    qrSettings: {
      enabled: { type: Boolean, default: true },
      fields: [dynamicFieldSchema]
    },

    // ========== COMPANY PROFILE (DYNAMIC) ==========
    companyProfile: {
      enabled: { type: Boolean, default: true },
      logo: { type: String }, // URL or base64
      fields: [dynamicFieldSchema]
    },

    // ========== BRANCH-SPECIFIC CONFIG ==========
    branchSpecificConfig: {
      enabled: { type: Boolean, default: false },
      branches: [{
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
        branchName: { type: String },
        attendanceSettings: {
          enabled: { type: Boolean, default: true },
          fields: [dynamicFieldSchema]
        }
      }]
    },

    // ========== GENERAL SETTINGS ==========
    generalSettings: {
      fiscalYearStart: { type: String, default: "04-01" },
      timezone: { type: String, default: "Asia/Kolkata" },
      currency: { type: String, default: "INR" },
      dateFormat: { type: String, default: "DD-MM-YYYY" }
    },

    // ========== AUDIT ==========
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// ========== INDEXES ==========
organizationConfigSchema.index({ orgId: 1 });
organizationConfigSchema.index({ isActive: 1 });

// ========== DEFAULT FIELDS GENERATORS ==========
organizationConfigSchema.statics.getDefaultAttendanceFields = function() {
  return [
    {
      key: "fullDayBefore",
      label: "Full Day Before",
      type: "time",
      value: "10:00",
      required: true,
      editable: true,
      deletable: false,
      description: "Check-in before this time = Full Day",
      order: 1
    },
    {
      key: "lateBefore",
      label: "Late Before",
      type: "time",
      value: "11:00",
      required: true,
      editable: true,
      deletable: false,
      description: "Between Full Day and this time = Late",
      order: 2
    },
    {
      key: "halfDayBefore",
      label: "Half Day Before",
      type: "time",
      value: "14:00",
      required: true,
      editable: true,
      deletable: false,
      description: "Between Late and this time = Half Day",
      order: 3
    },
    {
      key: "gracePeriodEnabled",
      label: "Grace Period",
      type: "toggle",
      value: false,
      required: false,
      editable: true,
      deletable: false,
      description: "Allow grace period for check-in",
      order: 4
    },
    {
      key: "gracePeriodMinutes",
      label: "Grace Period Minutes",
      type: "number",
      value: 15,
      unit: "minutes",
      min: 0,
      max: 60,
      required: false,
      editable: true,
      deletable: false,
      description: "Grace period duration in minutes",
      order: 5
    },
    {
      key: "workFromHomeEnabled",
      label: "Work From Home",
      type: "toggle",
      value: false,
      required: false,
      editable: true,
      deletable: false,
      description: "Allow employees to mark WFH attendance",
      order: 6
    }
  ];
};

organizationConfigSchema.statics.getDefaultDeductionFields = function() {
  return [
    {
      key: "lateRuleEnabled",
      label: "Late Deduction Rule",
      type: "toggle",
      value: true,
      required: false,
      editable: true,
      deletable: false,
      description: "Enable late attendance deduction",
      order: 1
    },
    {
      key: "lateCount",
      label: "Late Count",
      type: "number",
      value: 3,
      min: 1,
      max: 10,
      required: true,
      editable: true,
      deletable: false,
      description: "Number of late entries",
      order: 2
    },
    {
      key: "lateEquals",
      label: "Late Equals Absent",
      type: "number",
      value: 1,
      min: 0,
      max: 5,
      required: true,
      editable: true,
      deletable: false,
      description: "How many absent days late entries equal",
      order: 3
    },
    {
      key: "halfDayRuleEnabled",
      label: "Half Day Deduction Rule",
      type: "toggle",
      value: true,
      required: false,
      editable: true,
      deletable: false,
      description: "Enable half day deduction",
      order: 4
    },
    {
      key: "halfDayCount",
      label: "Half Day Count",
      type: "number",
      value: 2,
      min: 1,
      max: 10,
      required: true,
      editable: true,
      deletable: false,
      description: "Number of half day entries",
      order: 5
    },
    {
      key: "halfDayEquals",
      label: "Half Day Equals Absent",
      type: "number",
      value: 1,
      min: 0,
      max: 5,
      required: true,
      editable: true,
      deletable: false,
      description: "How many absent days half days equal",
      order: 6
    }
  ];
};

organizationConfigSchema.statics.getDefaultLeaveFields = function() {
  return [
    { key: "casualLeave", label: "Casual Leave", type: "number", value: 12, unit: "days", min: 0, max: 50, required: true, editable: true, deletable: false, description: "Annual casual leave quota", order: 1 },
    { key: "sickLeave", label: "Sick Leave", type: "number", value: 12, unit: "days", min: 0, max: 50, required: true, editable: true, deletable: false, description: "Annual sick leave quota", order: 2 },
    { key: "paidLeave", label: "Paid Leave", type: "number", value: 24, unit: "days", min: 0, max: 60, required: true, editable: true, deletable: false, description: "Annual paid leave quota", order: 3 },
    { key: "maternityLeave", label: "Maternity Leave", type: "number", value: 180, unit: "days", min: 0, max: 365, required: false, editable: true, deletable: false, description: "Maternity leave duration", order: 4 },
    { key: "paternityLeave", label: "Paternity Leave", type: "number", value: 15, unit: "days", min: 0, max: 60, required: false, editable: true, deletable: false, description: "Paternity leave duration", order: 5 },
    { key: "unpaidLeaveAllowed", label: "Allow Unpaid Leave", type: "toggle", value: true, required: false, editable: true, deletable: false, description: "Allow employees to take unpaid leave", order: 6 },
    { key: "carryForwardEnabled", label: "Carry Forward", type: "toggle", value: false, required: false, editable: true, deletable: false, description: "Allow leave carry forward to next year", order: 7 },
    { key: "carryForwardMaxDays", label: "Max Carry Forward Days", type: "number", value: 5, unit: "days", min: 0, max: 30, required: false, editable: true, deletable: false, description: "Maximum days that can be carried forward", order: 8 }
  ];
};

organizationConfigSchema.statics.getDefaultWorkingDaysFields = function() {
  return [
    { key: "monday", label: "Monday", type: "toggle", value: true, editable: true, deletable: false, order: 1 },
    { key: "tuesday", label: "Tuesday", type: "toggle", value: true, editable: true, deletable: false, order: 2 },
    { key: "wednesday", label: "Wednesday", type: "toggle", value: true, editable: true, deletable: false, order: 3 },
    { key: "thursday", label: "Thursday", type: "toggle", value: true, editable: true, deletable: false, order: 4 },
    { key: "friday", label: "Friday", type: "toggle", value: true, editable: true, deletable: false, order: 5 },
    { key: "saturday", label: "Saturday", type: "toggle", value: false, editable: true, deletable: false, order: 6 },
    { key: "sunday", label: "Sunday", type: "toggle", value: false, editable: true, deletable: false, order: 7 }
  ];
};

organizationConfigSchema.statics.getDefaultQRFields = function() {
  return [
    { key: "qrExpiryMinutes", label: "QR Expiry", type: "number", value: 5, unit: "minutes", min: 1, max: 60, required: true, editable: true, deletable: false, description: "How long QR codes remain valid", order: 1 },
    { key: "autoRefresh", label: "Auto Refresh QR", type: "toggle", value: true, required: false, editable: true, deletable: false, description: "Automatically refresh expired QR codes", order: 2 },
    { key: "allowMultipleBranches", label: "Allow Multiple Branches", type: "toggle", value: false, required: false, editable: true, deletable: false, description: "Allow one QR for all branches", order: 3 }
  ];
};

organizationConfigSchema.statics.getDefaultCompanyFields = function() {
  return [
    { key: "companyName", label: "Company Name", type: "text", value: "", required: true, editable: true, deletable: false, description: "Organization name", order: 1 },
    { key: "companyEmail", label: "Company Email", type: "text", value: "", required: false, editable: true, deletable: false, description: "Official company email", order: 2 },
    { key: "companyPhone", label: "Company Phone", type: "text", value: "", required: false, editable: true, deletable: false, description: "Contact number", order: 3 },
    { key: "companyAddress", label: "Company Address", type: "text", value: "", required: false, editable: true, deletable: false, description: "Office address", order: 4 },
    { key: "panNumber", label: "PAN Number", type: "text", value: "", required: false, editable: true, deletable: false, description: "Company PAN", order: 5 },
    { key: "gstNumber", label: "GST Number", type: "text", value: "", required: false, editable: true, deletable: false, description: "GST registration number", order: 6 }
  ];
};

// ========== GET OR CREATE CONFIG ==========
organizationConfigSchema.statics.getOrCreateConfig = async function(orgId) {
  let config = await this.findOne({ orgId, isActive: true });

  if (!config) {
    config = await this.create({
      orgId,
      attendanceSettings: { enabled: true, fields: this.getDefaultAttendanceFields() },
      deductionSettings: { enabled: true, fields: this.getDefaultDeductionFields() },
      leaveSettings: { enabled: true, fields: this.getDefaultLeaveFields() },
      workingDaysSettings: { enabled: true, fields: this.getDefaultWorkingDaysFields() },
      qrSettings: { enabled: true, fields: this.getDefaultQRFields() },
      companyProfile: { enabled: true, logo: null, fields: this.getDefaultCompanyFields() }
    });
  }

  return config;
};

// ========== HELPER: GET FIELD VALUE ==========
organizationConfigSchema.methods.getFieldValue = function(section, key) {
  const sectionData = this[section];
  if (!sectionData || !sectionData.fields) return null;
  const field = sectionData.fields.find(f => f.key === key);
  return field ? field.value : null;
};

// ========== ATTENDANCE STATUS CALCULATION ==========
organizationConfigSchema.methods.getAttendanceStatus = function(checkInTime) {
  const checkIn = new Date(checkInTime);
  const hours = checkIn.getHours();
  const minutes = checkIn.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const fullDayBefore = this.getFieldValue('attendanceSettings', 'fullDayBefore') || "10:00";
  const lateBefore = this.getFieldValue('attendanceSettings', 'lateBefore') || "11:00";
  const halfDayBefore = this.getFieldValue('attendanceSettings', 'halfDayBefore') || "14:00";
  const gracePeriodEnabled = this.getFieldValue('attendanceSettings', 'gracePeriodEnabled') || false;
  const gracePeriodMinutes = this.getFieldValue('attendanceSettings', 'gracePeriodMinutes') || 0;

  const [fullHour, fullMin] = fullDayBefore.split(':').map(Number);
  const [lateHour, lateMin] = lateBefore.split(':').map(Number);
  const [halfHour, halfMin] = halfDayBefore.split(':').map(Number);

  const fullDayMinutes = fullHour * 60 + fullMin;
  const lateMinutes = lateHour * 60 + lateMin;
  const halfDayMinutes = halfHour * 60 + halfMin;

  const graceMinutes = gracePeriodEnabled ? gracePeriodMinutes : 0;
  const effectiveFullDayMinutes = fullDayMinutes + graceMinutes;

  if (totalMinutes < effectiveFullDayMinutes) return 'FULL_DAY';
  else if (totalMinutes < lateMinutes) return 'LATE';
  else if (totalMinutes < halfDayMinutes) return 'HALF_DAY';
  else return 'ABSENT';
};

// ========== DEDUCTION CALCULATION ==========
organizationConfigSchema.methods.calculateDeductions = function(lateCount, halfDayCount) {
  let deductions = 0;

  const lateRuleEnabled = this.getFieldValue('deductionSettings', 'lateRuleEnabled');
  const lateCountConfig = this.getFieldValue('deductionSettings', 'lateCount') || 3;
  const lateEquals = this.getFieldValue('deductionSettings', 'lateEquals') || 1;
  const halfDayRuleEnabled = this.getFieldValue('deductionSettings', 'halfDayRuleEnabled');
  const halfDayCountConfig = this.getFieldValue('deductionSettings', 'halfDayCount') || 2;
  const halfDayEquals = this.getFieldValue('deductionSettings', 'halfDayEquals') || 1;

  if (lateRuleEnabled) deductions += Math.floor(lateCount / lateCountConfig) * lateEquals;
  if (halfDayRuleEnabled) deductions += Math.floor(halfDayCount / halfDayCountConfig) * halfDayEquals;

  return deductions;
};

// ========== CHECK WORKING DAY ==========
organizationConfigSchema.methods.isWorkingDay = function(date) {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[new Date(date).getDay()];
  return this.getFieldValue('workingDaysSettings', dayName) || false;
};

const OrganizationConfig = mongoose.model("OrganizationConfig", organizationConfigSchema, "organizationconfig");

export default OrganizationConfig;