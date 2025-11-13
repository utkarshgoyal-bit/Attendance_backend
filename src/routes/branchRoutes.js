import express from "express";
import { createBranch, getBranches, updateBranch } from "../controllers/branchController.js";

const router = express.Router();

router.post("/", createBranch);
router.get("/", getBranches);
router.put("/:id", updateBranch);

export default router;
