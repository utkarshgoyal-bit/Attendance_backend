import express from "express";
import {
  createSalary,
  getSalaries,
  editSalary,
  calculateSalaryFromAttendance
} from "../controllers/salaryController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== HR/ADMIN ONLY ROUTES ==========
// Only HR and Super Admin can manage salaries

// Create salary record
router.post("/", requireRole('HR_ADMIN', 'SUPER_ADMIN'), createSalary);

// Get all salaries
router.get("/", requireRole('HR_ADMIN', 'SUPER_ADMIN'), getSalaries);

// Edit salary record
router.put("/:id", requireRole('HR_ADMIN', 'SUPER_ADMIN'), editSalary);

// Auto-calculate salary from attendance
router.post("/calculate-from-attendance", requireRole('HR_ADMIN', 'SUPER_ADMIN'), calculateSalaryFromAttendance);

export default router;
