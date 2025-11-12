import express from "express";
import { getEmployees, getEmployeeStats } from "../controllers/employeeController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== MANAGER/HR/ADMIN ROUTES ==========
// Managers can view their team, HR/Admin can view all employees

// Stats endpoint should come before the generic "/" route to avoid conflicts
router.get("/stats", requireRole('HR_ADMIN', 'SUPER_ADMIN'), getEmployeeStats);

// Get employees - managers can view (typically filtered by team)
router.get("/", requireRole('MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'), getEmployees);

export default router;
