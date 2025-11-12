import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";
import OrganizationConfig from "../models/organizationConfigModel.js";

// FUNCTION 1: Mark Attendance (Check-in)
// Route: POST /api/attendance/checkin
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, qrCodeId, branchId } = req.body;

    // Validate required fields
    if (!employeeId || !qrCodeId) {
      return res.status(400).json({
        message: "Employee ID and QR Code ID are required"
      });
    }

    // Lookup employee - accept both ObjectId and eId
    let employee;
    let actualEmployeeId;

    // Check if it's a valid ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(employeeId);

    if (isObjectId) {
      // It's an ObjectId - use directly
      employee = await Employee.findById(employeeId);
      actualEmployeeId = employeeId;
    } else {
      // It's an eId - lookup by eId field
      employee = await Employee.findOne({ eId: employeeId });
      actualEmployeeId = employee ? employee._id : null;
    }

    if (!employee) {
      return res.status(404).json({
        message: `Employee not found with ID: ${employeeId}`
      });
    }

    console.log(`Found employee: ${employee.firstName} ${employee.lastName} (${employee.eId})`);

    // Get today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if attendance already exists for this employee today
    const existingAttendance = await Attendance.findOne({
      employeeId: actualEmployeeId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already marked for today",
        attendance: existingAttendance
      });
    }

    // Get current time for check-in
    const checkInTime = new Date();
    const currentHour = checkInTime.getHours();
    const currentMinute = checkInTime.getMinutes();

    // ========== USE DYNAMIC CONFIG FOR STATUS CALCULATION ==========
    // Get org config (use default orgId for now)
    const orgId = "673db4bb4ea85b50f50f20d4"; // TODO: Get from employee record
    let config = await OrganizationConfig.findOne({ orgId });

    if (!config) {
      config = await OrganizationConfig.create({ orgId });
    }

    // Use the config's built-in method to calculate status
    const autoStatus = config.getAttendanceStatus(checkInTime);

    console.log(`Using config: Full=${config.attendanceTiming.fullDayBefore}, Late=${config.attendanceTiming.lateBefore}, Half=${config.attendanceTiming.halfDayBefore}`);
    console.log(`Check-in time: ${currentHour}:${currentMinute}, Status: ${autoStatus}`);

    // Create new attendance record
    const newAttendance = new Attendance({
      employeeId: actualEmployeeId,
      date: startOfDay,
      checkInTime,
      status: "PENDING",
      autoStatus,
      branchId,
      qrCodeId
    });

    const savedAttendance = await newAttendance.save();

    console.log(`Attendance marked for employee ${employee.firstName} ${employee.lastName} (${employee.eId}) at ${checkInTime}`);

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance: savedAttendance
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      message: "Failed to mark attendance",
      error: error.message
    });
  }
};

// FUNCTION 2: Get Today's Attendance
// Route: GET /api/attendance/today?branch=JAIPUR&status=PENDING
export const getTodayAttendance = async (req, res) => {
  try {
    const { branch, status } = req.query;

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Build query filter
    const query = {
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    // Apply optional filters
    if (branch) {
      query.branchId = branch;
    }

    if (status) {
      query.status = status;
    }

    // Find attendance records with employee details
    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName email eId'
      })
      // Don't populate approvedBy to avoid User model registration issues
      .sort({ checkInTime: 1 }) // Sort by check-in time (ascending)
      .lean();

    console.log(`Retrieved ${attendanceRecords.length} attendance records for today`);

    res.status(200).json({
      count: attendanceRecords.length,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({
      message: "Failed to fetch today's attendance",
      error: error.message
    });
  }
};

// FUNCTION 3: Approve Attendance
// Route: PUT /api/attendance/approve/:id
export const approveAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    // Validate required fields
    if (!approvedBy) {
      return res.status(400).json({
        message: "Approved by user ID is required"
      });
    }

    // Find and update attendance record
    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    // Update status to APPROVED
    attendance.status = "APPROVED";
    attendance.approvedBy = approvedBy;
    attendance.approvedAt = new Date();

    const updatedAttendance = await attendance.save();

    console.log(`Attendance ${id} approved by user ${approvedBy}`);

    res.status(200).json({
      message: "Attendance approved successfully",
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error("Error approving attendance:", error);
    res.status(500).json({
      message: "Failed to approve attendance",
      error: error.message
    });
  }
};

// FUNCTION 4: Reject Attendance
// Route: PUT /api/attendance/reject/:id
export const rejectAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, rejectionReason } = req.body;

    // Validate required fields
    if (!approvedBy) {
      return res.status(400).json({
        message: "Approved by user ID is required"
      });
    }

    // Find and update attendance record
    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found"
      });
    }

    // Update status to REJECTED
    attendance.status = "REJECTED";
    attendance.approvedBy = approvedBy;
    attendance.approvedAt = new Date();
    attendance.rejectionReason = rejectionReason || "No reason provided";

    const updatedAttendance = await attendance.save();

    console.log(`Attendance ${id} rejected by user ${approvedBy}`);

    res.status(200).json({
      message: "Attendance rejected successfully",
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error("Error rejecting attendance:", error);
    res.status(500).json({
      message: "Failed to reject attendance",
      error: error.message
    });
  }
};

// FUNCTION 5: Get Monthly Attendance Summary
// Route: GET /api/attendance/monthly?employeeId=xxx&month=January&year=2025
export const getMonthlyAttendance = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    // Validate required parameters
    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "Employee ID, month, and year are required"
      });
    }

    // Calculate start and end date for the given month
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) {
      return res.status(400).json({
        message: "Invalid month name"
      });
    }

    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59, 999);

    // Get total days in the month
    const totalDays = endDate.getDate();

    // Find all APPROVED attendance records for this employee in the month
    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lte: endDate },
      status: "APPROVED"
    }).lean();

    // Calculate attendance metrics
    let presentDays = attendanceRecords.length;
    let lateDays = 0;
    let halfDays = 0;

    attendanceRecords.forEach(record => {
      if (record.autoStatus === "LATE") {
        lateDays++;
      } else if (record.autoStatus === "HALF_DAY") {
        halfDays++;
      }
    });

    // ========== USE DYNAMIC CONFIG FOR DEDUCTIONS ==========
    // Get org config for deduction rules
    const orgId = "673db4bb4ea85b50f50f20d4"; // TODO: Get from employee record
    let config = await OrganizationConfig.findOne({ orgId });

    if (!config) {
      config = await OrganizationConfig.create({ orgId });
    }

    // Use config's built-in method to calculate deductions
    const totalDeductions = config.calculateDeductions(lateDays, halfDays);

    // Calculate final attendance
    const finalAttendance = presentDays - totalDeductions;

    console.log(`Monthly attendance for employee ${employeeId}: ${finalAttendance}/${totalDays} days`);

    res.status(200).json({
      employeeId,
      month,
      year: parseInt(year),
      totalDays,
      presentDays,
      lateDays,
      halfDays,
      totalDeductions,
      finalAttendance,
      deductionRules: {
        lateRule: config.deductions.lateRule,
        halfDayRule: config.deductions.halfDayRule
      },
      attendanceRecords
    });
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    res.status(500).json({
      message: "Failed to fetch monthly attendance",
      error: error.message
    });
  }
};
