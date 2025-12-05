const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: String,
  address: {
    street: String, city: String, state: String, pincode: String, country: { type: String, default: 'India' }
  },
  contact: { email: String, phone: String, website: String },
  statutory: { gst: String, pan: String },
  
  // Feature Toggles
  features: {
    checkoutTracking: { type: Boolean, default: false },
    workingHoursCalc: { type: Boolean, default: false },
    multipleShifts: { type: Boolean, default: false },
    flexibleTiming: { type: Boolean, default: false },
    overtimeTracking: { type: Boolean, default: false },
    overtimeApproval: { type: Boolean, default: false },
    overtimePay: { type: Boolean, default: false },
    autoApproveAttendance: { type: Boolean, default: false },
    multiBranch: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: false },
    smsNotifications: { type: Boolean, default: false },
    whatsappNotifications: { type: Boolean, default: false },
  },
  
  // Attendance Config
  attendanceConfig: {
    defaultShift: {
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '18:00' },
      gracePeriod: { type: Number, default: 15 },
      lateThreshold: { type: Number, default: 30 },
      halfDayThreshold: { type: Number, default: 120 },
    },
    geoFenceRadius: { type: Number, default: 100 },
    officeLocation: { lat: Number, lng: Number },
  },
  
  // Leave Config
  leaveConfig: {
    types: [{
      code: String, name: String, defaultQuota: Number, 
      carryForward: Boolean, maxCarryForward: Number, encashable: Boolean
    }],
    workingDays: { type: [String], default: ['Mon','Tue','Wed','Thu','Fri','Sat'] },
  },
  
  // Salary Config
  salaryConfig: {
    pfEmployeePercent: { type: Number, default: 12 },
    pfEmployerPercent: { type: Number, default: 12 },
    pfThreshold: { type: Number, default: 15000 },
    esiEmployeePercent: { type: Number, default: 0.75 },
    esiEmployerPercent: { type: Number, default: 3.25 },
    esiThreshold: { type: Number, default: 21000 },
  },
  
  // Holidays
  holidays: [{ date: Date, name: String, optional: Boolean }],
  
  setupComplete: { type: Boolean, default: false },
  setupStep: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Default leave types on create
organizationSchema.pre('save', function() {
  if (this.isNew && (!this.leaveConfig?.types || this.leaveConfig.types.length === 0)) {
    this.leaveConfig = {
      ...this.leaveConfig,
      types: [
        { code: 'CL', name: 'Casual Leave', defaultQuota: 12, carryForward: false, encashable: false },
        { code: 'SL', name: 'Sick Leave', defaultQuota: 6, carryForward: false, encashable: false },
        { code: 'PL', name: 'Paid Leave', defaultQuota: 15, carryForward: true, maxCarryForward: 30, encashable: true },
        { code: 'LWP', name: 'Leave Without Pay', defaultQuota: 0, carryForward: false, encashable: false },
      ]
    };
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
