import express from "express";
import {
  markAttendance,
  getTodayAttendance,
  approveAttendance,
  rejectAttendance,
  getMonthlyAttendance
} from "../controllers/attendanceController.js";
import { getActiveQR, validateQR } from "../controllers/qrController.js";

const router = express.Router();

// QR code routes - must come before other routes to avoid conflicts
router.get("/qr/active", getActiveQR);
router.post("/qr/validate", validateQR);

// Employee marks attendance by scanning QR code
router.post("/checkin", markAttendance);

// Get today's attendance list for manager (with optional filters)
router.get("/today", getTodayAttendance);

// Get monthly attendance summary for salary calculation
router.get("/monthly", getMonthlyAttendance);

// Approve specific attendance record
router.put("/approve/:id", approveAttendance);

// Reject specific attendance record
router.put("/reject/:id", rejectAttendance);

export default router;
