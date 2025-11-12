import express from "express";
import {
  applyLeave,
  getLeaveBalance,
  getLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  bulkApproveLeaves
} from "../controllers/leaveController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== EMPLOYEE ROUTES ==========
// Any authenticated employee can apply for leave
router.post("/apply", requireRole('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), applyLeave);

// Any authenticated employee can check their leave balance
router.get("/balance/:employeeId", requireRole('EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getLeaveBalance);

// ========== MANAGER/HR/ADMIN ROUTES ==========
// View all leaves - managers can see their team, HR/Admin can see all
router.get("/", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getLeaves);

// View pending leaves - requires manager level or above
router.get("/pending", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getPendingLeaves);

// Approve/Reject leaves - requires manager level or above
router.put("/approve/:id", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), approveLeave);
router.put("/reject/:id", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), rejectLeave);

// Bulk operations - requires manager level or above
router.post("/bulk-approve", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), bulkApproveLeaves);

export default router;
