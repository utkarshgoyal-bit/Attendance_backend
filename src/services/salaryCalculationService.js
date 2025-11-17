import EmployeeSalaryStructure from "../models/employeeSalaryStructureModel.js";
import StatutoryTemplate from "../models/statutoryTemplateModel.js";
import SalaryComponent from "../models/salaryComponentModel.js";
import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";

class SalaryCalculationService {
  
  // ========== MAIN CALCULATION METHOD ==========
  async calculateSalary(employeeId, month, year) {
    try {
      console.log(`\n🔢 Starting salary calculation for employee ${employeeId}, ${month} ${year}`);
      
      // 1. Get employee details
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }
      
      // 2. Get employee salary structure (earnings)
      const structure = await EmployeeSalaryStructure.findOne({
        employeeId,
        isActive: true
      }).populate('components.componentId');
      
      if (!structure) {
        throw new Error('No active salary structure found for this employee');
      }
      
      // 3. Get attendance data
      const attendanceData = await this.getAttendanceData(employeeId, month, year);
      
      // 4. Calculate earnings with attendance
      const earnings = await this.calculateEarnings(structure, attendanceData);
      
      // 5. Get all active statutory templates
      const templates = await StatutoryTemplate.getActiveTemplates(employee.orgId || 'ORG001');
      
      // 6. Calculate deductions using templates
      const deductions = await this.calculateDeductions(templates, earnings, attendanceData, employee);
      
      // 7. Final calculation
      const result = {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        month,
        year,
        attendance: attendanceData,
        earnings: earnings.items,
        grossEarnings: earnings.total,
        deductions: deductions.items,
        totalDeductions: deductions.total,
        netSalary: earnings.total - deductions.total
      };
      
      console.log(`✅ Calculation complete. Net Salary: ₹${result.netSalary}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error in salary calculation:', error);
      throw error;
    }
  }
  
  // ========== GET ATTENDANCE DATA ==========
  async getAttendanceData(employeeId, month, year) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(month);
    
    if (monthIndex === -1) {
      throw new Error('Invalid month name');
    }
    
    // Get date range for the month
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);
    const totalDays = endDate.getDate();
    
    // Get attendance records
    const records = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: 'APPROVED'
    });
    
    let presentDays = 0;
    let fullDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    
    records.forEach(record => {
      if (record.autoStatus === 'FULL_DAY') fullDays++;
      if (record.autoStatus === 'LATE') lateDays++;
      if (record.autoStatus === 'HALF_DAY') halfDays++;
    });
    
    presentDays = fullDays + lateDays + halfDays;
    
    return {
      totalDays,
      presentDays,
      fullDays,
      lateDays,
      halfDays,
      attendancePercentage: (presentDays / totalDays) * 100
    };
  }
  
  // ========== CALCULATE EARNINGS ==========
  async calculateEarnings(structure, attendanceData) {
    const earnings = [];
    let total = 0;
    
    for (const comp of structure.components) {
      const component = comp.componentId;
      let amount = comp.value;
      
      // Apply attendance proration if component is attendance-based
      if (component.isAttendanceBased) {
        amount = (amount / attendanceData.totalDays) * attendanceData.presentDays;
      }
      
      earnings.push({
        componentId: component._id,
        code: component.code,
        name: component.name,
        originalAmount: comp.value,
        amount: Math.round(amount),
        isAttendanceBased: component.isAttendanceBased
      });
      
      total += Math.round(amount);
    }
    
    return {
      items: earnings,
      total
    };
  }
  
  // ========== CALCULATE DEDUCTIONS ==========
  async calculateDeductions(templates, earnings, attendanceData, employee) {
    const deductions = [];
    let total = 0;
    
    // Get basic salary (needed for PF calculation)
    const basicComponent = earnings.items.find(e => e.code === 'BASE');
    const basicSalary = basicComponent ? basicComponent.amount : 0;
    
    const grossSalary = earnings.total;
    
    for (const template of templates) {
      // Check if template is applicable
      if (!this.isTemplateApplicable(template, grossSalary, basicSalary, employee)) {
        console.log(`⏭️  Skipping ${template.code} - Not applicable`);
        continue;
      }
      
      // Calculate deduction based on template
      const amount = this.calculateFromTemplate(template, {
        basicSalary,
        grossSalary,
        attendanceData
      });
      
      if (amount > 0) {
        deductions.push({
          templateId: template._id,
          code: template.code,
          name: template.templateName,
          amount: Math.round(amount),
          calculationMethod: template.calculationMethod
        });
        
        total += Math.round(amount);
      }
    }
    
    return {
      items: deductions,
      total
    };
  }
  
  // ========== CHECK IF TEMPLATE IS APPLICABLE ==========
  isTemplateApplicable(template, grossSalary, basicSalary, employee) {
    // If mandatory, always applicable
    if (template.applicability.mandatory) {
      return true;
    }
    
    // Check conditions
    for (const condition of template.applicability.conditions) {
      const fieldValue = condition.field === 'GROSS_SALARY' ? grossSalary : 
                         condition.field === 'BASIC_SALARY' ? basicSalary : null;
      
      if (fieldValue === null) continue;
      
      // Apply operator
      switch (condition.operator) {
        case '<':
          if (!(fieldValue < condition.value)) return false;
          break;
        case '>':
          if (!(fieldValue > condition.value)) return false;
          break;
        case '<=':
          if (!(fieldValue <= condition.value)) return false;
          break;
        case '>=':
          if (!(fieldValue >= condition.value)) return false;
          break;
        case '==':
          if (!(fieldValue == condition.value)) return false;
          break;
        default:
          break;
      }
    }
    
    return true;
  }
  
  // ========== CALCULATE FROM TEMPLATE ==========
  calculateFromTemplate(template, data) {
    const { basicSalary, grossSalary, attendanceData } = data;
    
    switch (template.calculationMethod) {
      case 'PERCENTAGE':
        return this.calculatePercentage(template, basicSalary, grossSalary, attendanceData);
      
      case 'FIXED_AMOUNT':
        return this.calculateFixedAmount(template, attendanceData);
      
      case 'SLAB_BASED':
        return this.calculateSlabBased(template, grossSalary);
      
      default:
        return 0;
    }
  }
  
  // ========== PERCENTAGE CALCULATION ==========
  calculatePercentage(template, basicSalary, grossSalary, attendanceData) {
    const config = template.percentageConfig;
    
    // Determine base amount
    let baseAmount = 0;
    if (config.calculateOn === 'BASIC_SALARY') {
      baseAmount = basicSalary;
    } else if (config.calculateOn === 'GROSS_SALARY') {
      baseAmount = grossSalary;
    }
    
    // Apply ceiling if exists
    if (template.hasCeiling && baseAmount > template.ceilingAmount) {
      baseAmount = template.ceilingAmount;
      console.log(`   📌 Ceiling applied: ₹${template.ceilingAmount}`);
    }
    
    // Calculate percentage
    let amount = (baseAmount * config.employeePercentage) / 100;
    
    // Apply attendance proration if needed
    if (template.isAttendanceBased) {
      const ratio = attendanceData.presentDays / attendanceData.totalDays;
      amount = amount * ratio;
    }
    
    return amount;
  }
  
  // ========== FIXED AMOUNT CALCULATION ==========
  calculateFixedAmount(template, attendanceData) {
    let amount = template.fixedAmount;
    
    // Apply attendance proration if needed
    if (template.isAttendanceBased) {
      const ratio = attendanceData.presentDays / attendanceData.totalDays;
      amount = amount * ratio;
    }
    
    return amount;
  }
  
  // ========== SLAB-BASED CALCULATION ==========
  calculateSlabBased(template, grossSalary) {
    // Find applicable slab
    for (const slab of template.slabs) {
      if (grossSalary >= slab.minAmount && grossSalary <= slab.maxAmount) {
        return slab.value;
      }
    }
    
    return 0;
  }
}

export default new SalaryCalculationService();