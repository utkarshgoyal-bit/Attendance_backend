const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  eId: { type: String, required: true }, // Employee ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Personal Details
  personal: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dob: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', ''] },
    currentAddress: String,
    permanentAddress: String,
    emergencyContact: { name: String, relation: String, phone: String },
    photo: String,
  },
  
  // Professional Details
  professional: {
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: String,
    joiningDate: { type: Date, required: true },
    probationPeriod: { type: Number, default: 0 }, // months
    confirmationDate: Date,
    noticePeriod: { type: Number, default: 30 }, // days
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    employeeType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
    status: { 
      type: String, 
      enum: ['Active', 'Probation', 'Confirmed', 'Notice Period', 'Inactive', 'Absconding', 'Terminated'], 
      default: 'Probation' 
    },
    previousExperience: Number, // months
    skills: [String],
  },
  
  // Bank Details
  bank: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    pan: String,
    aadhar: String,
  },
  
  // Leave Balance
  leaveBalance: { type: Map, of: Number, default: {} },
  
  // Custom Fields
  customFields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  
  // Documents
  documents: [{
    type: { type: String }, // Resume, ID Proof, Certificate, etc.
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Exit Details
  exit: {
    resignationDate: Date,
    lastWorkingDate: Date,
    reason: String,
    exitInterviewDone: Boolean,
    fnfStatus: { type: String, enum: ['Pending', 'Processed', 'Completed', ''] },
    experienceLetterIssued: Boolean,
  },
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Compound index for unique eId per org
employeeSchema.index({ orgId: 1, eId: 1 }, { unique: true });
employeeSchema.index({ orgId: 1, 'personal.email': 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
