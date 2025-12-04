import express from "express";
import { 
  getConfig, updateConfig, updateSection, resetConfig,
  checkAttendanceStatus, calculateDeductions 
} from "../controllers/config.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:orgId", requireRole("HR_ADMIN"), getConfig);
router.put("/:orgId", requireRole("SUPER_ADMIN"), updateConfig);
router.put("/:orgId/:section", requireRole("SUPER_ADMIN"), updateSection);
router.post("/:orgId/reset", requireRole("SUPER_ADMIN"), resetConfig);

// Utility endpoints
router.post("/:orgId/check-status", requireRole("HR_ADMIN"), checkAttendanceStatus);
router.post("/:orgId/calculate-deductions", requireRole("HR_ADMIN"), calculateDeductions);

export default router;
