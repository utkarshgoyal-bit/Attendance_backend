import express from "express";
import { 
  calculateSalary, saveSalary, getSalaries, approveSalary, bulkCalculate,
  getSalaryConfig, updateSalaryConfig,
  getSalaryComponents, createSalaryComponent, updateSalaryComponent
} from "../controllers/salary.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Salary calculation & management
router.post("/calculate", requireRole("HR_ADMIN"), calculateSalary);
router.post("/save", requireRole("HR_ADMIN"), saveSalary);
router.get("/", requireRole("HR_ADMIN"), getSalaries);
router.put("/approve/:id", requireRole("HR_ADMIN"), approveSalary);
router.post("/bulk-calculate", requireRole("HR_ADMIN"), bulkCalculate);

// Salary config
router.get("/config", requireRole("HR_ADMIN"), getSalaryConfig);
router.put("/config", requireRole("SUPER_ADMIN"), updateSalaryConfig);

// Salary components
router.get("/components", requireRole("HR_ADMIN"), getSalaryComponents);
router.post("/components", requireRole("SUPER_ADMIN"), createSalaryComponent);
router.put("/components/:id", requireRole("SUPER_ADMIN"), updateSalaryComponent);

export default router;
