import express from "express";
import { getEmployees, getEmployeeStats } from "../controllers/employeeController.js";

const router = express.Router();

// Stats endpoint should come before the generic "/" route to avoid conflicts
router.get("/stats", getEmployeeStats);
router.get("/", getEmployees);

export default router;
