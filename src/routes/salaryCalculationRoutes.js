import express from "express";
import {
  calculateEmployeeSalary,
  calculateAndSaveSalary,
  testCalculation,
  bulkCalculateSalaries,
  bulkSaveSalaries  // 👈 ADD THIS
} from "../controllers/salaryCalculationController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== SALARY CALCULATION ROUTES ==========

// Test calculation (preview without saving)
router.get(
  "/test",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  testCalculation
);

// Calculate salary (returns result, doesn't save)
router.post(
  "/calculate",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  calculateEmployeeSalary
);

// Calculate and save salary
router.post(
  "/calculate-and-save",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  calculateAndSaveSalary
);
// Bulk calculate for multiple employees
router.post(
  "/bulk-calculate",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  bulkCalculateSalaries
);
// Bulk save salaries
router.post(
  "/bulk-save",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  bulkSaveSalaries
);
export default router;