import mongoose from "mongoose";

const salaryConfigSchema = new mongoose.Schema({
  employeePF: { type: Number, required: true }, 
  employeeESI: { type: Number, required: true},
  companyPF: { type:Number, required:true},
  companyESI: { type:Number, required:true},
  companyPension: { type: Number, required: true, }, 
  pfThresholdMin: { type: Number, required: true,},
  pfThresholdMax: { type: Number, required: true,  },
  esiThresholdMin: { type: Number, required: true, },
  esiThresholdMax: { type: Number, required: true, },
}, { timestamps: true });

const SalaryConfig = mongoose.model("SalaryConfig", salaryConfigSchema);
export default SalaryConfig;
