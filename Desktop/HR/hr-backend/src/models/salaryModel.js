import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  attendanceDays: { type: Number, required: true },
  totalDays: { type: Number, default: 30 },
  base: { type: Number, default: 0 },
  hra: { type: Number, default: 0 },
  conveyance: { type: Number, default: 0 },
  netPayable: { type: Number, default: 0 },
  ctc: { type: Number, default: 0 },
  month: { type: String },
  year: { type: Number },
}, { timestamps: true });

// Add indexes for performance optimization
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true }); // Compound unique index
salarySchema.index({ month: 1, year: 1 }); // Index for filtering by month and year
salarySchema.index({ employeeId: 1 }); // Index for employee-specific queries
salarySchema.index({ year: 1 }); // Index for year-based queries

const Salary = mongoose.model("Salary", salarySchema);
export default Salary;
