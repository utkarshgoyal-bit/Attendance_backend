import express from "express";
import { 
  createOrganization, getOrganizations, getOrganization, 
  updateOrganization, deleteOrganization 
} from "../controllers/organization.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", requireRole("SUPER_ADMIN"), getOrganizations);
router.get("/:id", requireRole("HR_ADMIN"), getOrganization);
router.post("/", requireRole("SUPER_ADMIN"), createOrganization);
router.put("/:id", requireRole("SUPER_ADMIN"), updateOrganization);
router.delete("/:id", requireRole("SUPER_ADMIN"), deleteOrganization);

export default router;
