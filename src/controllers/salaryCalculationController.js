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
// ========== BULK SAVE SALARIES ==========
export const bulkSaveSalaries = async (req, res) => {
  try {
    const { month, year, salaries } = req.body;

    if (!month || !year || !salaries || salaries.length === 0) {
      return res.status(400).json({
        message: "month, year, and salaries array are required"
      });
    }

    console.log(`\n💾 Bulk saving ${salaries.length} salaries...`);

    const saved = [];
    const errors = [];

    for (const salaryData of salaries) {
      try {
        // Check if salary already exists
        const existing = await Salary.findOne({
          employeeId: salaryData.employeeId,
          month,
          year
        });

        if (existing) {
          errors.push({
            employeeId: salaryData.employeeId,
            employeeName: salaryData.employeeName,
            error: 'Salary already exists for this month'
          });
          continue;
        }

        // Create new salary record
        const salary = new Salary({
          employeeId: salaryData.employeeId,
          month,
          year,
          attendanceDays: salaryData.attendance.presentDays,
          totalDays: salaryData.attendance.totalDays,
          base: salaryData.earnings?.find(e => e.code === 'BASE')?.amount || 0,
          hra: salaryData.earnings?.find(e => e.code === 'HRA')?.amount || 0,
          conveyance: salaryData.earnings?.find(e => e.code === 'CONVEYANCE')?.amount || 0,
          netPayable: salaryData.netSalary,
          ctc: salaryData.grossEarnings
        });

        await salary.save();
        
        saved.push({
          employeeId: salaryData.employeeId,
          employeeName: salaryData.employeeName,
          status: 'SAVED'
        });

      } catch (error) {
        console.error(`❌ Error saving for ${salaryData.employeeId}:`, error.message);
        errors.push({
          employeeId: salaryData.employeeId,
          employeeName: salaryData.employeeName,
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk save complete: ${saved.length} saved, ${errors.length} errors`);

    res.status(200).json({
      message: "Bulk save completed",
      summary: {
        total: salaries.length,
        saved: saved.length,
        failed: errors.length
      },
      saved,
      errors
    });

  } catch (error) {
    console.error("Error in bulk save:", error);
    res.status(500).json({
      message: "Failed to save salaries",
      error: error.message
    });
  }
};
// ========== BULK CALCULATE FOR ALL EMPLOYEES ==========
export const bulkCalculateSalaries = async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        message: "month and year are required"
      });
    }

    // Get all active employees if no specific IDs provided
    let employees;
    if (employeeIds && employeeIds.length > 0) {
      employees = employeeIds;
    } else {
      const Employee = (await import("../models/employeeModel.js")).default;
      const allEmployees = await Employee.find({ 
        MONGO_DELETED: false,
        isActive: true 
      }).select('_id');
      employees = allEmployees.map(e => e._id.toString());
    }

    console.log(`\n📊 Bulk calculating salaries for ${employees.length} employees...`);

    const results = [];
    const errors = [];

    // Calculate for each employee
    for (const employeeId of employees) {
      try {
        const result = await salaryCalculationService.calculateSalary(employeeId, month, year);
        results.push({
          employeeId,
          employeeName: result.employeeName,
          status: 'SUCCESS',
          grossEarnings: result.grossEarnings,
          totalDeductions: result.totalDeductions,
          netSalary: result.netSalary,
          attendance: result.attendance
        });
      } catch (error) {
        console.error(`❌ Error calculating for ${employeeId}:`, error.message);
        errors.push({
          employeeId,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    console.log(`✅ Bulk calculation complete: ${results.length} success, ${errors.length} errors`);

    res.status(200).json({
      message: "Bulk calculation completed",
      summary: {
        total: employees.length,
        successful: results.length,
        failed: errors.length
      },
      results,
      errors
    });

  } catch (error) {
    console.error("Error in bulk calculation:", error);
    res.status(500).json({
      message: "Failed to process bulk calculation",
      error: error.message
    });
  }
};