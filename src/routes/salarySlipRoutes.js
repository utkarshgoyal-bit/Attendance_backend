import express from "express";
import {
  generateSalarySlip,
  generateBulkSlips
} from "../controllers/salarySlipController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== SALARY SLIP ROUTES ==========

// Generate single salary slip (PDF download)
router.get(
  "/generate/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'EMPLOYEE'),
  generateSalarySlip
);

// Get info for bulk generation
router.get(
  "/bulk",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  generateBulkSlips
);

export default router;