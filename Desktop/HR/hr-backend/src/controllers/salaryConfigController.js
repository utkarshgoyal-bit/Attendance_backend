import SalaryConfig from "../models/salaryConfigModel.js";

export const createOrUpdateSalaryConfig = async (req, res) => {
  try {
    const {
      employeePF,
      employeeESI,
      companyPF,
      companyESI,
      companyPension,
      pfThresholdMin,
      pfThresholdMax,
      esiThresholdMin,
      esiThresholdMax,
    } = req.body;


    let config = await SalaryConfig.findOne();
    if (config) {
      config.employeePF = employeePF !== undefined ? employeePF : config.employeePF;
      config.employeeESI = employeeESI !== undefined ? employeeESI : config.employeeESI;
      config.companyPF = companyPF !== undefined ? companyPF : config.companyPF;
      config.companyESI = companyESI !== undefined ? companyESI : config.companyESI;
      config.companyPension = companyPension !== undefined ? companyPension : config.companyPension;
      config.pfThresholdMin = pfThresholdMin !== undefined ? pfThresholdMin : config.pfThresholdMin;
      config.pfThresholdMax = pfThresholdMax !== undefined ? pfThresholdMax : config.pfThresholdMax;
      config.esiThresholdMin = esiThresholdMin !== undefined ? esiThresholdMin : config.esiThresholdMin;
      config.esiThresholdMax = esiThresholdMax !== undefined ? esiThresholdMax : config.esiThresholdMax;
      await config.save();
    } else {
      config = new SalaryConfig({
        employeePF,
        employeeESI,
        companyPF,
        companyESI,
        companyPension,
        pfThresholdMin,
        pfThresholdMax,
        esiThresholdMin,
        esiThresholdMax,
      });
      await config.save();
    }

    res.status(200).json({ message: "Salary config updated successfully", config });
  } catch (error) {
    console.error("Error updating salary config:", error);
    res.status(500).json({ message: "Failed to update salary config", error: error.message });
  }
};

export const getSalaryConfig = async (req, res) => {
  try {
    const config = await SalaryConfig.findOne();
    if (!config) {
      return res.status(404).json({ message: "Salary config not found" });
    }
    res.status(200).json(config);
  } catch (error) {
    console.error("Error fetching salary config:", error);
    res.status(500).json({ message: "Failed to fetch salary config", error: error.message });
  }
};

// export const editSalaryConfig = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const updatedConfig = await SalaryConfig.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedConfig) {
//       return res.status(404).json({ message: "Salary config not found" });
//     }

//     res.status(200).json({ message: "Salary config updated successfully", config: updatedConfig });
//   } catch (error) {
//     console.error("Error updating salary config:", error);
//     res.status(500).json({ message: "Failed to update salary config", error: error.message });
//   }
// };
