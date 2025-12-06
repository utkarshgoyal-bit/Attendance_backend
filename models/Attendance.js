const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  date: { type: Date, required: true, index: true },
  
  checkIn: { time: Date, location: { lat: Number, lng: Number }, method: { type: String, enum: ['QR', 'MANUAL', 'GEO', 'BIOMETRIC'] } },
  checkOut: { time: Date, location: { lat: Number, lng: Number } },
  
  status: { 
    type: String, 
    enum: ['FULL_DAY', 'LATE', 'HALF_DAY', 'ABSENT', 'WFH', 'ON_DUTY', 'COMP_OFF', 'HOLIDAY', 'WEEK_OFF'],
    default: 'ABSENT'
  },
  
  workingHours: Number,
  isRegularized: { type: Boolean, default: false },
  regularization: {
    reason: String,
    requestedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    remarks: String
  },
  
  remarks: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
}, { timestamps: true });

attendanceSchema.index({ orgId: 1, employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);