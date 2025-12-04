import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  // Personal Info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  
  // Employment
  eId: { type: String, required: true, unique: true },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  joiningDate: { type: Date, default: Date.now },
  
  // Organization
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  
  // Salary (Basic components)
  salary: {
    base: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    ctc: { type: Number, default: 0 }
  },
  
  // Auth
  hasAccount: { type: Boolean, default: false },
  password: { type: String, select: false },
  role: { 
    type: String, 
    enum: ["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"], 
    default: "EMPLOYEE" 
  },
  
  // Status
  isActive: { type: Boolean, default: true, index: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
employeeSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Calculate CTC before save
employeeSchema.pre("save", function(next) {
  if (this.salary) {
    this.salary.ctc = (this.salary.base || 0) + (this.salary.hra || 0) + (this.salary.conveyance || 0);
  }
  next();
});

// Indexes
employeeSchema.index({ orgId: 1, isActive: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ eId: 1 });

export default mongoose.model("Employee", employeeSchema, "employees");
