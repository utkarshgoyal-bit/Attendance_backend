import express from "express";
import { createOrUpdateSalaryConfig, getSalaryConfig } from "../controllers/salaryConfigController.js";

const router = express.Router();

router.put("/", createOrUpdateSalaryConfig);
router.get("/", getSalaryConfig);

export default router;
