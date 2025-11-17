import salaryCalculationService from "../services/salaryCalculationService.js";
import Salary from "../models/salaryModel.js";

// ========== CALCULATE SALARY FOR ONE EMPLOYEE ==========
export const calculateEmployeeSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Validation
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month, and year are required"
      });
    }

    // Calculate salary using the service
    const result = await salaryCalculationService.calculateSalary(employeeId, month, year);

    res.status(200).json({
      message: "Salary calculated successfully",
      salary: result
    });

  } catch (error) {
    console.error("Error calculating salary:", error);
    res.status(500).json({
      message: "Failed to calculate salary",
      error: error.message
    });
  }
};

// ========== CALCULATE AND SAVE SALARY ==========
export const calculateAndSaveSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Validation
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month, and year are required"
      });
    }

    // Check if salary already exists
    const existing = await Salary.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(409).json({
        message: "Salary already calculated for this month. Use update instead."
      });
    }

    // Calculate salary
    const result = await salaryCalculationService.calculateSalary(employeeId, month, year);

    // Save to database
    const salary = new Salary({
      employeeId: result.employeeId,
      month: result.month,
      year: result.year,
      attendanceDays: result.attendance.presentDays,
      totalDays: result.attendance.totalDays,
      base: result.earnings.find(e => e.code === 'BASE')?.amount || 0,
      hra: result.earnings.find(e => e.code === 'HRA')?.amount || 0,
      conveyance: result.earnings.find(e => e.code === 'CONVEYANCE')?.amount || 0,
      netPayable: result.netSalary,
      ctc: result.grossEarnings
    });

    await salary.save();

    res.status(201).json({
      message: "Salary calculated and saved successfully",
      salary: result
    });

  } catch (error) {
    console.error("Error calculating and saving salary:", error);
    res.status(500).json({
      message: "Failed to calculate and save salary",
      error: error.message
    });
  }
};

// ========== TEST CALCULATION (Preview without saving) ==========
export const testCalculation = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month, and year are required"
      });
    }

    const result = await salaryCalculationService.calculateSalary(employeeId, month, year);

    res.status(200).json({
      message: "Test calculation completed",
      preview: result,
      note: "This is a preview. Salary not saved to database."
    });

  } catch (error) {
    console.error("Error in test calculation:", error);
    res.status(500).json({
      message: "Failed to test calculation",
      error: error.message
    });
  }
};