import express from "express";
import { createBranch, getBranches, getBranch, updateBranch, deleteBranch } from "../controllers/organization.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getBranches);
router.get("/:id", getBranch);
router.post("/", requireRole("HR_ADMIN"), createBranch);
router.put("/:id", requireRole("HR_ADMIN"), updateBranch);
router.delete("/:id", requireRole("SUPER_ADMIN"), deleteBranch);

export default router;
