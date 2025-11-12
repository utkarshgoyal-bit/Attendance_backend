import express from "express";
import {
  createSalary,
  getSalaries,
  editSalary,
  calculateSalaryFromAttendance
} from "../controllers/salaryController.js";

const router = express.Router();

router.post("/", createSalary);
router.get("/", getSalaries);
router.put("/:id", editSalary);

// Auto-calculate salary from attendance
router.post("/calculate-from-attendance", calculateSalaryFromAttendance);

export default router;
