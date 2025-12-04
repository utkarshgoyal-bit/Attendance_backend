import express from "express";
import { 
  getActiveQR, checkIn, getTodayAttendance, 
  approveAttendance, rejectAttendance, bulkApprove, getMonthlyAttendance 
} from "../controllers/attendance.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (QR-based attendance)
router.get("/qr/active", getActiveQR);
router.post("/checkin", checkIn);

// Protected routes
router.get("/today", requireRole("MANAGER"), getTodayAttendance);
router.put("/approve/:id", requireRole("MANAGER"), approveAttendance);
router.put("/reject/:id", requireRole("MANAGER"), rejectAttendance);
router.post("/bulk-approve", requireRole("MANAGER"), bulkApprove);
router.get("/monthly", requireRole("EMPLOYEE"), getMonthlyAttendance);

export default router;
