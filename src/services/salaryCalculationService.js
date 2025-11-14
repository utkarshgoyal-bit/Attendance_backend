import Salary from "../models/enhancedSalaryModel.js";
import EmployeeSalaryStructure from "../models/employeeSalaryStructureModel.js";
import SalaryComponent from "../models/salaryComponentModel.js";
import StatutoryConfig from "../models/statutoryConfigModel.js";
import Attendance from "../models/attendanceModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";
import Employee from "../models/employeeModel.js";

class SalaryCalculationService {
  
  /**
   * Main method to calculate salary for an employee for a given month/year
   */
  async calculateSalary(employeeId, month, year) {
    try {
      console.log(`\n🔄 Starting salary calculation for employee ${employeeId} - ${month} ${year}`);
      
      // 1. Get employee details
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // 2. Get employee's active salary structure
      const structure = await EmployeeSalaryStructure.getActiveStructure(employeeId);
      if (!structure) {
        throw new Error('No active salary structure found for employee');
      }

      console.log(`✅ Found salary structure: CTC = ₹${structure.monthlyCTC}`);

      // 3. Get attendance data
      const attendanceData = await this.getAttendanceData(employeeId, month, year);
      console.log(`✅ Attendance data: ${attendanceData.payableDays}/${attendanceData.totalDays} payable days`);

      // 4. Get statutory configuration
      const orgId = employee.orgId || "673db4bb4ea85b50f50f20d4"; // TODO: Get from employee
      const statutoryConfig = await StatutoryConfig.getOrCreateConfig(orgId);

      // 5. Calculate earnings
      const earnings = await this.calculateEarnings(structure, attendanceData);
      console.log(`✅ Total earnings: ₹${earnings.total}`);

      // 6. Calculate deductions (including statutory)
      const deductions = await this.calculateDeductions(structure, earnings, statutoryConfig);
      console.log(`✅ Total deductions: ₹${deductions.total}`);

      // 7. Get any adjustments (arrears, bonuses, penalties)
      const adjustments = await this.getAdjustments(employeeId, month, year);

      // 8. Calculate statutory contributions
      const statutory = this.calculateStatutoryBreakdown(earnings.total, statutoryConfig);

      // 9. Calculate net payable
      const grossEarnings = earnings.total;
      const totalDeductions = deductions.total;
      const adjustmentTotal = adjustments.reduce((sum, adj) => {
        return adj.category === 'EARNING' ? sum + adj.amount : sum - adj.amount;
      }, 0);
      const netPayable = grossEarnings - totalDeductions + adjustmentTotal;

      console.log(`✅ Net payable: ₹${netPayable}\n`);

      // 10. Create or update salary record
      const salaryRecord = {
        employeeId,
        salaryStructureId: structure._id,
        month,
        year,
        attendanceData,
        earnings: earnings.items,
        deductions: deductions.items,
        adjustments,
        grossEarnings,
        totalDeductions,
        totalAdjustments: adjustmentTotal,
        netPayable,
        ctc: structure.monthlyCTC, // For legacy compatibility
        statutoryContributions: statutory,
        status: 'DRAFT',
        calculatedAt: new Date()
      };

      return salaryRecord;

    } catch (error) {
      console.error(`❌ Error calculating salary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get attendance data for the month
   */
  async getAttendanceData(employeeId, month, year) {
    // Month name to index mapping
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = months.indexOf(month);

    if (monthIndex === -1) {
      throw new Error(`Invalid month name: ${month}`);
    }

    // Calculate date range for the month
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);
    const totalDays = endDate.getDate();

    // Get ALL attendance records for this employee in the month
    const records = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: "APPROVED"
    }).lean();

    // Count attendance by type
    let fullDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let holidayDays = 0;
    let weekOffDays = 0;

    records.forEach(record => {
      switch (record.autoStatus) {
        case "FULL_DAY": fullDays++; break;
        case "LATE": lateDays++; break;
        case "HALF_DAY": halfDays++; break;
        case "PAID_LEAVE": paidLeaveDays++; break;
        case "UNPAID_LEAVE": unpaidLeaveDays++; break;
        case "HOLIDAY": holidayDays++; break;
        case "WEEK_OFF": weekOffDays++; break;
      }
    });

    const presentDays = fullDays + lateDays + halfDays;

    // Get organization config for deduction rules
    const orgId = "673db4bb4ea85b50f50f20d4"; // TODO: Get from employee record
    let config = await OrganizationConfig.findOne({ orgId });

    if (!config) {
      config = await OrganizationConfig.create({ orgId });
    }

    // Calculate deductions based on config
    let lateDeduction = 0;
    let halfDayDeduction = 0;

    if (config.deductions.lateRule.enabled) {
      lateDeduction = Math.floor(lateDays / config.deductions.lateRule.count);
    }

    if (config.deductions.halfDayRule.enabled) {
      halfDayDeduction = Math.floor(halfDays / config.deductions.halfDayRule.count);
    }

    const totalDeductions = lateDeduction + halfDayDeduction;

    // Calculate payable days
    const payableDays = presentDays + paidLeaveDays + holidayDays + weekOffDays - totalDeductions;
    const absentDays = totalDays - (presentDays + paidLeaveDays + unpaidLeaveDays + holidayDays + weekOffDays);

    return {
      totalDays,
      presentDays,
      payableDays,
      absentDays,
      fullDays,
      lateDays,
      halfDays,
      paidLeaveDays,
      unpaidLeaveDays,
      holidayDays,
      weekOffDays,
      lateDeduction,
      halfDayDeduction,
      totalDeductions
    };
  }

  /**
   * Calculate all earning components
   */
  async calculateEarnings(structure, attendanceData) {
    const earnings = [];
    const { payableDays, totalDays } = attendanceData;

    for (const comp of structure.components) {
      const component = await SalaryComponent.findById(comp.componentId);
      
      if (!component || component.category !== 'EARNING') continue;

      let baseAmount = comp.value;
      let finalAmount = baseAmount;

      // Calculate based on component type
      switch (component.type) {
        case 'FIXED':
          // Fixed amount - prorate if attendance-based
          if (component.isAttendanceBased) {
            finalAmount = Math.round((baseAmount / totalDays) * payableDays);
          }
          break;

        case 'VARIABLE':
          // Variable amount - no proration
          finalAmount = baseAmount;
          break;

        case 'PERCENTAGE':
          // Calculate based on calculation type
          if (component.calculationType === 'PERCENTAGE_OF_BASE') {
            const baseComponent = structure.components.find(c => 
              c.componentId.code === 'BASE' || c.componentId.name === 'Basic'
            );
            if (baseComponent) {
              baseAmount = (baseComponent.value * comp.value) / 100;
              if (component.isAttendanceBased) {
                finalAmount = Math.round((baseAmount / totalDays) * payableDays);
              } else {
                finalAmount = Math.round(baseAmount);
              }
            }
          } else if (component.calculationType === 'PERCENTAGE_OF_GROSS') {
            // Will be calculated in second pass
            finalAmount = 0;
          } else if (component.calculationType === 'PERCENTAGE_OF_CTC') {
            baseAmount = (structure.monthlyCTC * comp.value) / 100;
            if (component.isAttendanceBased) {
              finalAmount = Math.round((baseAmount / totalDays) * payableDays);
            } else {
              finalAmount = Math.round(baseAmount);
            }
          }
          break;

        case 'FORMULA':
          // Evaluate custom formula
          finalAmount = this.evaluateFormula(component.formula, structure, attendanceData);
          break;
      }

      earnings.push({
        componentId: component._id,
        componentCode: component.code,
        componentName: component.name,
        calculationType: component.calculationType,
        baseAmount,
        amount: Math.round(finalAmount),
        isProrated: component.isAttendanceBased
      });
    }

    // Second pass for PERCENTAGE_OF_GROSS components
    const grossBeforePercentage = earnings.reduce((sum, e) => sum + e.amount, 0);
    
    for (const comp of structure.components) {
      const component = await SalaryComponent.findById(comp.componentId);
      
      if (component && 
          component.category === 'EARNING' && 
          component.calculationType === 'PERCENTAGE_OF_GROSS') {
        
        const amount = Math.round((grossBeforePercentage * comp.value) / 100);
        
        earnings.push({
          componentId: component._id,
          componentCode: component.code,
          componentName: component.name,
          calculationType: component.calculationType,
          baseAmount: amount,
          amount,
          isProrated: false
        });
      }
    }

    return {
      items: earnings,
      total: earnings.reduce((sum, e) => sum + e.amount, 0)
    };
  }

  /**
   * Calculate all deductions including statutory
   */
  async calculateDeductions(structure, earnings, statutoryConfig) {
    const deductions = [];
    const grossEarnings = earnings.total;

    // 1. Calculate statutory deductions

    // PF
    if (statutoryConfig.pf.enabled) {
      const pfCalc = statutoryConfig.calculatePF(grossEarnings);
      if (pfCalc.employee > 0) {
        deductions.push({
          componentCode: 'PF',
          componentName: 'Provident Fund',
          calculationType: 'STATUTORY',
          amount: pfCalc.employee,
          isStatutory: true
        });
      }
    }

    // ESI
    if (statutoryConfig.esi.enabled) {
      const esiCalc = statutoryConfig.calculateESI(grossEarnings);
      if (esiCalc.employee > 0) {
        deductions.push({
          componentCode: 'ESI',
          componentName: 'Employee State Insurance',
          calculationType: 'STATUTORY',
          amount: esiCalc.employee,
          isStatutory: true
        });
      }
    }

    // Professional Tax (if enabled and applicable)
    // PT is usually deducted in specific month, handled separately

    // 2. Calculate custom deduction components from salary structure
    for (const comp of structure.components) {
      const component = await SalaryComponent.findById(comp.componentId);
      
      if (!component || component.category !== 'DEDUCTION') continue;

      let amount = comp.value;

      // Calculate based on type
      if (component.calculationType === 'PERCENTAGE_OF_GROSS') {
        amount = Math.round((grossEarnings * comp.value) / 100);
      } else if (component.calculationType === 'PERCENTAGE_OF_BASE') {
        const baseComponent = structure.components.find(c => 
          c.componentId.code === 'BASE'
        );
        if (baseComponent) {
          amount = Math.round((baseComponent.value * comp.value) / 100);
        }
      }

      deductions.push({
        componentId: component._id,
        componentCode: component.code,
        componentName: component.name,
        calculationType: component.calculationType,
        amount: Math.round(amount),
        isStatutory: false
      });
    }

    return {
      items: deductions,
      total: deductions.reduce((sum, d) => sum + d.amount, 0)
    };
  }

  /**
   * Calculate statutory breakdown for reporting
   */
  calculateStatutoryBreakdown(grossEarnings, statutoryConfig) {
    const pf = statutoryConfig.calculatePF(grossEarnings);
    const esi = statutoryConfig.calculateESI(grossEarnings);

    return {
      pf: {
        employee: pf.employee,
        employer: pf.employer,
        pension: pf.pension
      },
      esi: {
        employee: esi.employee,
        employer: esi.employer
      },
      pt: 0, // Calculated separately if needed
      tds: 0, // Calculated separately if needed
      lwf: {
        employee: 0,
        employer: 0
      }
    };
  }

  /**
   * Get adjustments for the employee in the period
   */
  async getAdjustments(employeeId, month, year) {
    // TODO: Implement adjustment retrieval from a separate collection
    // For now, return empty array
    return [];
  }

  /**
   * Evaluate custom formula
   */
  evaluateFormula(formula, structure, attendanceData) {
    try {
      // Replace component codes with actual values
      let evaluableFormula = formula;

      structure.components.forEach(comp => {
        const component = comp.componentId;
        if (component && component.code) {
          evaluableFormula = evaluableFormula.replace(
            new RegExp(component.code, 'g'),
            comp.value.toString()
          );
        }
      });

      // Replace attendance variables
      evaluableFormula = evaluableFormula.replace(/PAYABLE_DAYS/g, attendanceData.payableDays);
      evaluableFormula = evaluableFormula.replace(/TOTAL_DAYS/g, attendanceData.totalDays);

      // Evaluate the formula safely
      // Note: In production, use a proper expression evaluator library
      const result = eval(evaluableFormula);
      return Math.round(result);

    } catch (error) {
      console.error(`Error evaluating formula: ${formula}`, error);
      return 0;
    }
  }

  /**
   * Calculate salary for multiple employees (bulk processing)
   */
  async calculateBulkSalary(employeeIds, month, year) {
    const results = [];
    const errors = [];

    for (const employeeId of employeeIds) {
      try {
        const salaryData = await this.calculateSalary(employeeId, month, year);
        
        // Save to database
        const salary = await Salary.findOneAndUpdate(
          { employeeId, month, year },
          salaryData,
          { upsert: true, new: true, runValidators: true }
        );

        results.push({
          employeeId,
          status: 'SUCCESS',
          salaryId: salary._id,
          netPayable: salary.netPayable
        });

      } catch (error) {
        errors.push({
          employeeId,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    return {
      success: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Recalculate salary (for revisions)
   */
  async recalculateSalary(salaryId) {
    const existingSalary = await Salary.findById(salaryId);
    if (!existingSalary) {
      throw new Error('Salary record not found');
    }

    const newCalculation = await this.calculateSalary(
      existingSalary.employeeId,
      existingSalary.month,
      existingSalary.year
    );

    // Mark as revised
    existingSalary.isRevised = true;
    existingSalary.previousSalaryId = salaryId;

    // Update with new calculation
    Object.assign(existingSalary, newCalculation);
    existingSalary.status = 'DRAFT'; // Reset to draft after recalculation

    await existingSalary.save();

    return existingSalary;
  }
}

export default new SalaryCalculationService();
