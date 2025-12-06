const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['PLATFORM_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'];

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, required: true },
  
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  
  securityQuestions: [{
    question: String,
    answer: String
  }],
  
  isFirstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  tokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save - NO next() for bcryptjs 3.x
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hash security answer
userSchema.statics.hashAnswer = async (answer) => bcrypt.hash(answer.toLowerCase().trim(), 10);
userSchema.methods.compareAnswer = async function(index, answer) {
  return bcrypt.compare(answer.toLowerCase().trim(), this.securityQuestions[index].answer);
};

// Check if user can create a role
userSchema.methods.canCreateRole = function(targetRole) {
  const hierarchy = { PLATFORM_ADMIN: 4, ORG_ADMIN: 3, HR_ADMIN: 2, MANAGER: 1, EMPLOYEE: 0 };
  return hierarchy[this.role] > hierarchy[targetRole];
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);