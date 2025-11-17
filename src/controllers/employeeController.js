import Employee from "../models/employeeModel.js";
import Salary from "../models/salaryModel.js";

export const getEmployees = async (req, res) => {
  try {
    // Extract query parameters
    const {
      month,
      year,
      branch,
      search,
      page = 1,
      limit = 50
    } = req.query;

    // Build query filter
    const query = { MONGO_DELETED: false };

    // Branch filter
    if (branch && branch !== 'All') {
      query['user.branch'] = branch;
    }

    // Search filter (firstName, lastName, email, eId)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { eId: searchRegex }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Employee.countDocuments(query);

    // Fetch employees with optimized query
    let employees = await Employee.find(query)
      .select('firstName lastName email eId baseSalary hra conveyance salaries user')
      .populate({
        path: "user",
        select: "firstName lastName email branch role",
      })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Convert to plain JavaScript objects for better performance

    // If month and year are provided, populate filtered salaries
    // If month and year are provided, populate filtered salaries
    if (month && year && year !== 'undefined' && !isNaN(parseInt(year))) {  // ✅ Add validation
      const employeeIds = employees.map(emp => emp._id);

      // Fetch only salaries matching the month and year
      const salaries = await Salary.find({
        employeeId: { $in: employeeIds },
        month: month,
        year: parseInt(year)
      }).lean();

      // Create a map for quick lookup
      const salaryMap = {};
      salaries.forEach(salary => {
        if (!salaryMap[salary.employeeId.toString()]) {
          salaryMap[salary.employeeId.toString()] = [];
        }
        salaryMap[salary.employeeId.toString()].push(salary);
      });

      // Attach filtered salaries to employees
      employees = employees.map(emp => ({
        ...emp,
        salaries: salaryMap[emp._id.toString()] || []
      }));
    } else {
      // If no month/year filter, don't populate salaries at all for performance
      employees = employees.map(emp => ({
        ...emp,
        salaries: []
      }));
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      employees,
      totalCount,
      page: pageNum,
      totalPages,
      limit: limitNum
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

export const createEmployee = async (req, res) => {
  try {
    console.log('Creating employee:', req.body);
    
    // Clean up the data before saving
    const employeeData = { ...req.body };
    
    // Fix managerId - remove if empty
    if (!employeeData.managerId || employeeData.managerId === '') {
      delete employeeData.managerId;
    }
    
    // Fix joiningDate - convert to timestamp
    if (employeeData.joiningDate) {
      employeeData.joiningDate = new Date(employeeData.joiningDate).getTime();
    }
    
    // Fix dob if present - convert to timestamp
    if (employeeData.dob) {
      employeeData.dob = new Date(employeeData.dob).getTime();
    }
    
    // Hash password if creating account
    if (employeeData.hasAccount && employeeData.password) {
      const bcrypt = await import('bcryptjs');
      employeeData.password = await bcrypt.default.hash(employeeData.password, 10);
    }
    
    console.log('Cleaned employee data:', employeeData);
    
    const employee = await Employee.create(employeeData);
    
    console.log('Employee created:', employee._id);
    
    res.status(201).json({
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({
      message: "Failed to create employee",
      error: error.message,
    });
  }
};
// ========== GET SINGLE EMPLOYEE ==========
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .select('firstName lastName email eId department designation joiningDate baseSalary hra conveyance')
      .lean();

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
};
export const getEmployeeStats = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "Month and year are required parameters"
      });
    }

    // Get total employees count (excluding deleted)
    const totalEmployees = await Employee.countDocuments({
      MONGO_DELETED: false,
      isActive: true
    });

    // Use aggregation pipeline to calculate salary statistics
    const salaryStats = await Salary.aggregate([
      {
        $match: {
          month: month,
          year: parseInt(year)
        }
      },
      {
        $group: {
          _id: null,
          totalSalaryPaid: { $sum: "$netPayable" },
          averageSalary: { $avg: "$netPayable" },
          salariesProcessed: { $sum: 1 }
        }
      }
    ]);

    // Extract results or use defaults if no salaries found
    const stats = salaryStats.length > 0 ? salaryStats[0] : {
      totalSalaryPaid: 0,
      averageSalary: 0,
      salariesProcessed: 0
    };

    // Calculate pending salaries
    const pendingSalaries = totalEmployees - stats.salariesProcessed;

    // Get employees with pending salaries (IDs only for performance)
    const employeesWithSalaries = await Salary.find({
      month: month,
      year: parseInt(year)
    }).distinct('employeeId');

    const employeesWithPendingSalaries = await Employee.find({
      _id: { $nin: employeesWithSalaries },
      MONGO_DELETED: false,
      isActive: true
    }).select('firstName lastName email eId').lean();

    res.status(200).json({
      totalEmployees,
      totalSalaryPaid: Math.round(stats.totalSalaryPaid * 100) / 100,
      averageSalary: Math.round(stats.averageSalary * 100) / 100,
      salariesProcessed: stats.salariesProcessed,
      pendingSalaries,
      employeesWithPendingSalaries,
      month,
      year: parseInt(year)
    });

  } catch (error) {
    console.error("Error fetching employee stats:", error);
    res.status(500).json({
      message: "Failed to fetch employee stats",
      error: error.message,
    });
  }
};