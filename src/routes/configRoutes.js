import express from 'express';
import {
  getConfig,
  updateSection,
  toggleSection,
  addField,
  updateField,
  deleteField,
  reorderFields,
  bulkUpdateFieldValues,
  resetSection,
  resetAllToDefaults,
  uploadLogo,
  toggleBranchSpecific,
  checkAttendanceStatus,
  calculateDeductions
} from '../controllers/configController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========== MAIN CONFIG ==========
router.get('/:orgId', requireRole('HR_ADMIN', 'SUPER_ADMIN'), getConfig);
router.post('/:orgId/reset', requireRole('SUPER_ADMIN'), resetAllToDefaults);

// ========== SECTION OPERATIONS ==========
router.put('/:orgId/section/:section', requireRole('SUPER_ADMIN'), updateSection);
router.patch('/:orgId/section/:section/toggle', requireRole('SUPER_ADMIN'), toggleSection);
router.post('/:orgId/section/:section/reset', requireRole('SUPER_ADMIN'), resetSection);
router.patch('/:orgId/section/:section/bulk-update', requireRole('SUPER_ADMIN'), bulkUpdateFieldValues);
router.patch('/:orgId/section/:section/reorder', requireRole('SUPER_ADMIN'), reorderFields);

// ========== FIELD OPERATIONS ==========
router.post('/:orgId/section/:section/field', requireRole('SUPER_ADMIN'), addField);
router.put('/:orgId/section/:section/field/:fieldId', requireRole('SUPER_ADMIN'), updateField);
router.delete('/:orgId/section/:section/field/:fieldId', requireRole('SUPER_ADMIN'), deleteField);

// ========== COMPANY PROFILE ==========
router.post('/:orgId/logo', requireRole('SUPER_ADMIN'), uploadLogo);

// ========== BRANCH CONFIG ==========
router.patch('/:orgId/branch-specific', requireRole('SUPER_ADMIN'), toggleBranchSpecific);

// ========== UTILITY ROUTES ==========
router.post('/:orgId/check-status', requireRole('HR_ADMIN', 'SUPER_ADMIN'), checkAttendanceStatus);
router.post('/:orgId/calculate-deductions', requireRole('HR_ADMIN', 'SUPER_ADMIN'), calculateDeductions);

export default router;