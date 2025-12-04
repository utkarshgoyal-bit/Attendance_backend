import mongoose from "mongoose";

// Salary Component Schema (Dynamic salary components)
const salaryComponentSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  category: { type: String, enum: ["EARNING", "DEDUCTION", "EMPLOYER_CONTRIBUTION"], required: true },
  type: { type: String, enum: ["FIXED", "PERCENTAGE", "FORMULA"], default: "FIXED" },
  value: { type: Number, default: 0 },
  formula: { type: String },
  isActive: { type: Boolean, default: true },
  isTaxable: { type: Boolean, default: true },
  isStatutory: { type: Boolean, default: false },
  isAttendanceBased: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

// Employee Salary Structure (Components assigned to employee)
const employeeSalaryStructureSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date },
  ctc: { type: Number, required: true },
  components: [{
    componentId: { type: mongoose.Schema.Types.ObjectId, ref: "SalaryComponent" },
    value: { type: Number, required: true }
  }],
  isActive: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED"], default: "DRAFT" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  approvedAt: { type: Date }
}, { timestamps: true });

// Salary Record (Monthly salary calculations)
const salarySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  
  // Attendance
  attendanceDays: { type: Number, required: true },
  totalDays: { type: Number, default: 30 },
  
  // Earnings
  earnings: {
    base: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    other: [{ name: String, amount: Number }]
  },
  grossEarnings: { type: Number, default: 0 },
  
  // Deductions
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    other: [{ name: String, amount: Number }]
  },
  totalDeductions: { type: Number, default: 0 },
  
  // Final
  netPayable: { type: Number, default: 0 },
  ctc: { type: Number, default: 0 },
  
  // Status
  status: { type: String, enum: ["DRAFT", "PENDING", "APPROVED", "PROCESSED"], default: "DRAFT" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  approvedAt: { type: Date }
}, { timestamps: true });

// Salary Config (PF/ESI thresholds)
const salaryConfigSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", unique: true },
  employeePF: { type: Number, default: 12 },
  employerPF: { type: Number, default: 12 },
  employeeESI: { type: Number, default: 0.75 },
  employerESI: { type: Number, default: 3.25 },
  pfCeiling: { type: Number, default: 15000 },
  esiCeiling: { type: Number, default: 21000 }
}, { timestamps: true });

// Indexes
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ month: 1, year: 1 });

export const SalaryComponent = mongoose.model("SalaryComponent", salaryComponentSchema, "salarycomponents");
export const EmployeeSalaryStructure = mongoose.model("EmployeeSalaryStructure", employeeSalaryStructureSchema, "employeesalarystructures");
export const Salary = mongoose.model("Salary", salarySchema, "salaries");
export const SalaryConfig = mongoose.model("SalaryConfig", salaryConfigSchema, "salaryconfig");
