import express from "express";
import { createSalary, getSalaries, editSalary } from "../controllers/salaryController.js";

const router = express.Router();

router.post("/", createSalary);
router.get("/", getSalaries);
router.put("/:id", editSalary);

export default router;
