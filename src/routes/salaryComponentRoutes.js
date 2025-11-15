import express from "express";
import {
  createSalaryComponent,
  getSalaryComponents,
  getSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  toggleComponentStatus,
  bulkCreateComponents,
  getEarningComponents,
  getDeductionComponents
} from "../controllers/salaryComponentController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== SALARY COMPONENT ROUTES ==========
// All routes require HR_ADMIN or SUPER_ADMIN role

// Create new salary component
router.post(
  "/",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  createSalaryComponent
);

// Get all salary components (with optional filters)
router.get(
  "/",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getSalaryComponents
);

// Get earning components only
router.get(
  "/earnings",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getEarningComponents
);

// Get deduction components only
router.get(
  "/deductions",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getDeductionComponents
);

// Get single salary component by ID
router.get(
  "/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getSalaryComponent
);

// Update salary component
router.put(
  "/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  updateSalaryComponent
);

// Delete salary component
router.delete(
  "/:id",
  requireRole('SUPER_ADMIN'), // Only super admin can delete
  deleteSalaryComponent
);

// Toggle component active/inactive status
router.patch(
  "/:id/toggle",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  toggleComponentStatus
);

// Bulk create components
router.post(
  "/bulk",
  requireRole('SUPER_ADMIN'), // Only super admin for bulk operations
  bulkCreateComponents
);

export default router;