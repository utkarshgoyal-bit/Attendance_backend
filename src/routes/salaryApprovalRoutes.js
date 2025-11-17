import express from "express";
import {
  getPendingSalaries,
  approveSalary,
  bulkApproveSalaries,
  rejectSalary,
  getApprovedSalaries
} from "../controllers/salaryApprovalController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== SALARY APPROVAL ROUTES ==========
// All routes require HR_ADMIN or SUPER_ADMIN

// Get pending salaries (DRAFT status)
router.get(
  "/pending",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getPendingSalaries
);

// Get approved salaries
router.get(
  "/approved",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getApprovedSalaries
);

// Approve single salary
router.post(
  "/approve/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  approveSalary
);

// Bulk approve salaries
router.post(
  "/bulk-approve",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  bulkApproveSalaries
);

// Reject salary
router.post(
  "/reject/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  rejectSalary
);

export default router;