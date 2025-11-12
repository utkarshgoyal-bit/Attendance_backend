import express from "express";
import {
  markAttendance,
  getTodayAttendance,
  approveAttendance,
  rejectAttendance,
  getMonthlyAttendance,
  getMonthlyAttendanceSummary
} from "../controllers/attendanceController.js";
import { getActiveQR, validateQR } from "../controllers/qrController.js";

const router = express.Router();

// QR routes FIRST
router.get("/qr/active", getActiveQR);
router.post("/qr/validate", validateQR);

// Other routes
router.post("/checkin", markAttendance);
router.get("/today", getTodayAttendance);
router.get("/monthly", getMonthlyAttendance);
router.get("/monthly-summary", getMonthlyAttendanceSummary);
router.put("/approve/:id", approveAttendance);
router.put("/reject/:id", rejectAttendance);

export default router;