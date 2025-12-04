const mongoose = require('mongoose');

// Department
const departmentSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  code: String,
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  description: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
departmentSchema.index({ orgId: 1, name: 1 }, { unique: true });

// Branch
const branchSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  code: String,
  address: { street: String, city: String, state: String, pincode: String },
  contact: { email: String, phone: String },
  location: { lat: Number, lng: Number },
  geoFenceRadius: { type: Number, default: 100 },
  isHeadOffice: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
branchSchema.index({ orgId: 1, name: 1 }, { unique: true });

// Shift
const shiftSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  code: String,
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },
  gracePeriod: { type: Number, default: 15 }, // minutes
  lateThreshold: { type: Number, default: 30 },
  halfDayThreshold: { type: Number, default: 120 },
  workingDays: { type: [String], default: ['Mon','Tue','Wed','Thu','Fri','Sat'] },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
shiftSchema.index({ orgId: 1, name: 1 }, { unique: true });

// Custom Field Definition
const customFieldSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  key: { type: String, required: true }, // camelCase identifier
  fieldType: { 
    type: String, 
    enum: ['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'file', 'amount'],
    required: true 
  },
  options: [String], // For dropdown
  placeholder: String,
  helpText: String,
  isRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });
customFieldSchema.index({ orgId: 1, key: 1 }, { unique: true });

module.exports = {
  Department: mongoose.model('Department', departmentSchema),
  Branch: mongoose.model('Branch', branchSchema),
  Shift: mongoose.model('Shift', shiftSchema),
  CustomField: mongoose.model('CustomField', customFieldSchema),
};
