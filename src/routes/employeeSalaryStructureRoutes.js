import express from "express";
import {
  saveSalaryStructure,
  getEmployeeSalaryStructure,
  getStructureHistory
} from "../controllers/employeeSalaryStructureController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== SALARY STRUCTURE ROUTES ==========

// Save/Update salary structure
router.post(
  "/",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  saveSalaryStructure
);

// Get active salary structure for an employee
router.get(
  "/employee/:employeeId",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getEmployeeSalaryStructure
);

// Get structure history
router.get(
  "/employee/:employeeId/history",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getStructureHistory
);

export default router;