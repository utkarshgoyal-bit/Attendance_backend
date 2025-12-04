import mongoose from "mongoose";

// Simplified Organization Config Schema
const configSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
  
  // Attendance Settings
  attendance: {
    enabled: { type: Boolean, default: true },
    checkInStart: { type: String, default: "08:00" },
    checkInEnd: { type: String, default: "10:00" },
    fullDayBefore: { type: String, default: "10:00" },
    lateBefore: { type: String, default: "11:00" },
    halfDayBefore: { type: String, default: "14:00" },
    gracePeriod: { type: Number, default: 15 } // minutes
  },
  
  // Deduction Rules
  deductions: {
    enabled: { type: Boolean, default: true },
    lateRule: { enabled: Boolean, count: { type: Number, default: 3 }, deductDays: { type: Number, default: 1 } },
    halfDayRule: { enabled: Boolean, count: { type: Number, default: 2 }, deductDays: { type: Number, default: 1 } }
  },
  
  // Leave Settings
  leave: {
    enabled: { type: Boolean, default: true },
    casualLeave: { type: Number, default: 12 },
    sickLeave: { type: Number, default: 12 },
    earnedLeave: { type: Number, default: 24 },
    unpaidAllowed: { type: Boolean, default: true }
  },
  
  // Working Days
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false }
  },
  
  // QR Settings
  qr: {
    enabled: { type: Boolean, default: true },
    validityMinutes: { type: Number, default: 2 },
    autoRefresh: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Method to check attendance status
configSchema.methods.getAttendanceStatus = function(checkInTime) {
  const time = new Date(checkInTime);
  const minutes = time.getHours() * 60 + time.getMinutes();
  
  const parseTime = (str) => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };
  
  const fullDay = parseTime(this.attendance.fullDayBefore) + this.attendance.gracePeriod;
  const late = parseTime(this.attendance.lateBefore);
  const halfDay = parseTime(this.attendance.halfDayBefore);
  
  if (minutes < fullDay) return "FULL_DAY";
  if (minutes < late) return "LATE";
  if (minutes < halfDay) return "HALF_DAY";
  return "ABSENT";
};

// Method to calculate deductions
configSchema.methods.calculateDeductions = function(lateCount, halfDayCount) {
  let deductions = 0;
  if (this.deductions.lateRule.enabled) {
    deductions += Math.floor(lateCount / this.deductions.lateRule.count) * this.deductions.lateRule.deductDays;
  }
  if (this.deductions.halfDayRule.enabled) {
    deductions += Math.floor(halfDayCount / this.deductions.halfDayRule.count) * this.deductions.halfDayRule.deductDays;
  }
  return deductions;
};

// Method to check if day is working day
configSchema.methods.isWorkingDay = function(date) {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return this.workingDays[days[new Date(date).getDay()]];
};

export default mongoose.model("Config", configSchema, "organizationconfig");
