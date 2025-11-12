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
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== PUBLIC ROUTES ==========
// QR routes - no authentication required
router.get("/qr/active", getActiveQR);
router.post("/qr/validate", validateQR);

// Employee check-in - no authentication required (QR validation handles security)
router.post("/checkin", markAttendance);

// ========== MANAGER/HR/ADMIN ROUTES ==========
// View today's attendance - requires manager level or above
router.get("/today", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getTodayAttendance);

// Approve/Reject attendance - requires manager level or above
router.put("/approve/:id", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), approveAttendance);
router.put("/reject/:id", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), rejectAttendance);

// ========== AUTHENTICATED USER ROUTES ==========
// View monthly attendance - any authenticated user can view (typically their own)
router.get("/monthly", requireRole('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getMonthlyAttendance);

// Monthly summary - any authenticated user
router.get("/monthly-summary", requireRole('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getMonthlyAttendanceSummary);

export default router;