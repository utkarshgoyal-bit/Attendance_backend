import express from "express";
import { 
  getEmployees, getEmployeeById, createEmployee, 
  updateEmployee, deleteEmployee, getEmployeeStats 
} from "../controllers/employee.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/stats", requireRole("HR_ADMIN"), getEmployeeStats);
router.get("/", requireRole("MANAGER"), getEmployees);
router.get("/:id", requireRole("MANAGER"), getEmployeeById);
router.post("/", requireRole("HR_ADMIN"), createEmployee);
router.put("/:id", requireRole("HR_ADMIN"), updateEmployee);
router.delete("/:id", requireRole("HR_ADMIN"), deleteEmployee);

export default router;
