import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";

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

    // Get today's date range (start and end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Check if attendance already exists for this employee today
    const existingAttendance = await Attendance.findOne({
      employeeId,
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

    // Auto-calculate status based on time
    let autoStatus;
    if (currentHour < 10) {
      autoStatus = "FULL_DAY";
    } else if (currentHour === 10 && currentMinute === 0) {
      autoStatus = "FULL_DAY";
    } else if (currentHour === 10 || (currentHour === 11 && currentMinute === 0)) {
      autoStatus = "LATE";
    } else {
      autoStatus = "HALF_DAY";
    }

    // Create new attendance record
    const newAttendance = new Attendance({
      employeeId,
      date: startOfDay,
      checkInTime,
      status: "PENDING",
      autoStatus,
      branchId,
      qrCodeId
    });

    const savedAttendance = await newAttendance.save();

    console.log(`Attendance marked for employee ${employeeId} at ${checkInTime}`);

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
      .populate({
        path: 'approvedBy',
        select: 'firstName lastName email'
      })
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

    // Calculate deductions
    // 3 LATE = 1 ABSENT
    const lateDeductions = Math.floor(lateDays / 3);

    // 2 HALF_DAY = 1 ABSENT
    const halfDayDeductions = Math.floor(halfDays / 2);

    // Calculate final attendance
    const finalAttendance = presentDays - lateDeductions - halfDayDeductions;

    console.log(`Monthly attendance for employee ${employeeId}: ${finalAttendance}/${totalDays} days`);

    res.status(200).json({
      employeeId,
      month,
      year: parseInt(year),
      totalDays,
      presentDays,
      lateDays,
      halfDays,
      lateDeductions,
      halfDayDeductions,
      finalAttendance,
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
