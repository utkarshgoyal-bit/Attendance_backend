import Salary from "../models/salaryModel.js";
import Employee from "../models/employeeModel.js";
import SalaryConfig from "../models/salaryConfigModel.js";

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
