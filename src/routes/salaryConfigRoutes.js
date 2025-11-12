import express from "express";
import { createOrUpdateSalaryConfig, getSalaryConfig } from "../controllers/salaryConfigController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== HR/ADMIN ONLY ROUTES ==========
// Only HR and Super Admin can manage salary configuration

// Update salary configuration
router.put("/", requireRole('HR_ADMIN', 'SUPER_ADMIN'), createOrUpdateSalaryConfig);

// Get salary configuration
router.get("/", requireRole('HR_ADMIN', 'SUPER_ADMIN'), getSalaryConfig);

export default router;
