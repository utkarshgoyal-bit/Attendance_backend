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

const Salary = mongoose.model("Salary", salarySchema);
export default Salary;
