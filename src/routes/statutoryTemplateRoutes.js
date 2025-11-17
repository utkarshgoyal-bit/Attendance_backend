import express from "express";
import {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  toggleTemplateStatus,
  getActiveTemplates,
  importDefaultTemplates
} from "../controllers/statutoryTemplateController.js";
import { requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// ========== STATUTORY TEMPLATE ROUTES ==========
// All routes require HR_ADMIN or SUPER_ADMIN

// Import default templates (PF, ESI, PT)
router.post(
  "/import-defaults",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  importDefaultTemplates
);

// Get active templates only
router.get(
  "/active",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getActiveTemplates
);

// Create template
router.post(
  "/",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  createTemplate
);

// Get all templates
router.get(
  "/",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getTemplates
);

// Get single template
router.get(
  "/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  getTemplate
);

// Update template
router.put(
  "/:id",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  updateTemplate
);

// Delete template
router.delete(
  "/:id",
  requireRole('SUPER_ADMIN'),
  deleteTemplate
);

// Toggle template status
router.patch(
  "/:id/toggle",
  requireRole('HR_ADMIN', 'SUPER_ADMIN'),
  toggleTemplateStatus
);

export default router;