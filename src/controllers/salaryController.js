import Salary from "../models/salaryModel.js";
import Employee from "../models/employeeModel.js";
import SalaryConfig from "../models/salaryConfigModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";
import Attendance from "../models/attendanceModel.js";

export const createSalary = async (req, res) => {
  try {
    const {
      employeeId,
      attendanceDays,
      totalDays,
      base,
      hra,
      conveyance,
      netPayable,
      ctc,
      month,
      year,
    } = req.body;

    // Validation
    if (!employeeId || !attendanceDays || !month || !year) {
      return res.status(400).json({
        message: "Missing required fields: employeeId, attendanceDays, month, and year are required"
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Check for duplicate salary entry
    const existingSalary = await Salary.findOne({
      employeeId,
      month,
      year
    });

    if (existingSalary) {
      return res.status(409).json({
        message: "Salary record already exists for this employee in the specified month and year"
      });
    }

    // Validate numeric values
    if (attendanceDays < 0 || attendanceDays > totalDays) {
      return res.status(400).json({
        message: "Invalid attendance days. Must be between 0 and total days."
      });
    }

    const salary = new Salary({
      employeeId,
      attendanceDays,
      totalDays: totalDays || 30,
      base: base || 0,
      hra: hra || 0,
      conveyance: conveyance || 0,
      netPayable: netPayable || 0,
      ctc: ctc || 0,
      month,
      year,
    });

    await salary.save();
    await Employee.findByIdAndUpdate(employeeId, {
      $push: { salaries: salary._id }
    });

    res.status(201).json({ message: "Salary saved successfully", salary });
  } catch (error) {
    console.error("Error creating salary:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Salary record already exists for this employee in the specified month and year"
      });
    }

    res.status(500).json({
      message: "Failed to save salary",
      error: error.message
    });
  }
};

export const getSalaries = async (req, res) => {
  try {
    // Extract query parameters
    const {
      month,
      year,
      employeeId,
      page = 1,
      limit = 100
    } = req.query;

    // Build query filter
    const query = {};

    if (month) {
      query.month = month;
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Salary.countDocuments(query);

    // Fetch salaries with optimized query
    const salaries = await Salary.find(query)
      .populate("employeeId", "firstName lastName email eId")
      .skip(skip)
      .limit(limitNum)
      .sort({ year: -1, month: -1, createdAt: -1 })
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      salaries,
      totalCount,
      page: pageNum,
      totalPages,
      limit: limitNum
    });
  } catch (error) {
    console.error("Error fetching salaries:", error);
    res.status(500).json({
      message: "Failed to fetch salaries",
      error: error.message
    });
  }
};

export const editSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if salary exists
    const existingSalary = await Salary.findById(id);
    if (!existingSalary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    // Validate numeric values if provided
    if (updateData.attendanceDays !== undefined) {
      const totalDays = updateData.totalDays || existingSalary.totalDays;
      if (updateData.attendanceDays < 0 || updateData.attendanceDays > totalDays) {
        return res.status(400).json({
          message: "Invalid attendance days. Must be between 0 and total days."
        });
      }
    }

    // Validate that month and year are not being changed to create duplicate
    if (updateData.month || updateData.year) {
      const checkMonth = updateData.month || existingSalary.month;
      const checkYear = updateData.year || existingSalary.year;

      const duplicate = await Salary.findOne({
        _id: { $ne: id },
        employeeId: existingSalary.employeeId,
        month: checkMonth,
        year: checkYear
      });

      if (duplicate) {
        return res.status(409).json({
          message: "Cannot update: Another salary record already exists for this employee in the specified month and year"
        });
      }
    }

    // Update salary
    const updatedSalary = await Salary.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("employeeId", "firstName lastName email eId").lean();

    res.status(200).json({
      message: "Salary updated successfully",
      salary: updatedSalary
    });

  } catch (error) {
    console.error("Error updating salary:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Cannot update: Salary record already exists for this employee in the specified month and year"
      });
    }

    res.status(500).json({
      message: "Failed to update salary",
      error: error.message
    });
  }
};

// ========== AUTO-CALCULATE SALARY FROM ATTENDANCE ==========
// Route: POST /api/salaries/calculate-from-attendance
export const calculateSalaryFromAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    // Validate required parameters
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month, and year are required"
      });
    }

    // Get employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // Month name to index mapping
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIndex = months.indexOf(month);

    if (monthIndex === -1) {
      return res.status(400).json({
        message: "Invalid month name. Use full month names like 'January', 'November', etc."
      });
    }

    // Calculate date range for the month
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);
    const totalDays = endDate.getDate();

    // Get attendance records for this employee in the month
    const records = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: "APPROVED"
    }).lean();

    // Count attendance by status
    let presentDays = records.length;
    let lateDays = 0;
    let halfDays = 0;

    records.forEach(record => {
      if (record.autoStatus === "LATE") {
        lateDays++;
      } else if (record.autoStatus === "HALF_DAY") {
        halfDays++;
      }
    });

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
    const payableDays = presentDays - totalDeductions;

    // Get salary config for PF/ESI calculations
    const salaryConfig = await SalaryConfig.findOne();
    if (!salaryConfig) {
      return res.status(400).json({
        message: "Salary configuration not found. Please configure salary settings first."
      });
    }

    // Calculate salary components
    const base = employee.base || 0;
    const hra = employee.hra || 0;
    const conveyance = employee.conveyance || 0;

    // Calculate per day salary
    const perDaySalary = (base + hra + conveyance) / totalDays;
    const grossSalary = perDaySalary * payableDays;

    // Calculate deductions (PF, ESI)
    let employeePF = 0;
    let employeeESI = 0;

    if (base >= salaryConfig.pfThresholdMin && base <= salaryConfig.pfThresholdMax) {
      employeePF = (base * salaryConfig.employeePF) / 100;
    }

    if (base >= salaryConfig.esiThresholdMin && base <= salaryConfig.esiThresholdMax) {
      employeeESI = (base * salaryConfig.employeeESI) / 100;
    }

    const netPayable = grossSalary - employeePF - employeeESI;

    // Save or update salary record
    const salary = await Salary.findOneAndUpdate(
      { employeeId, month, year: parseInt(year) },
      {
        employeeId,
        month,
        year: parseInt(year),
        attendanceDays: payableDays,
        totalDays,
        base,
        hra,
        conveyance,
        netPayable: Math.round(netPayable),
        ctc: Math.round(grossSalary)
      },
      { upsert: true, new: true, runValidators: true }
    ).populate("employeeId", "firstName lastName email eId");

    console.log(`Salary calculated for ${employee.firstName} ${employee.lastName}: ${payableDays}/${totalDays} days, Net: ${Math.round(netPayable)}`);

    res.status(200).json({
      message: "Salary calculated and saved successfully",
      summary: {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        totalDays,
        presentDays,
        lateDays,
        halfDays,
        lateDeduction,
        halfDayDeduction,
        totalDeductions,
        payableDays,
        perDaySalary: Math.round(perDaySalary),
        grossSalary: Math.round(grossSalary),
        employeePF: Math.round(employeePF),
        employeeESI: Math.round(employeeESI),
        netPayable: Math.round(netPayable)
      },
      salary
    });

  } catch (error) {
    console.error("Error calculating salary from attendance:", error);
    res.status(500).json({
      message: "Failed to calculate salary",
      error: error.message
    });
  }
};
