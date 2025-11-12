import express from 'express';
import {
  getConfig,
  updateConfig,
  updateAttendanceTiming,
  updateDeductions,
  updateLeavePolicy,
  updateWorkingDays,
  updateQRSettings,
  updateGracePeriod,
  resetToDefaults,
  checkAttendanceStatus,
  calculateDeductions
} from '../controllers/configController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========== MAIN CONFIG ROUTES ==========

// Get organization configuration - HR and Super Admin can view
router.get('/:orgId', requireRole('HR_ADMIN', 'SUPER_ADMIN'), getConfig);

// Update entire configuration - Super Admin only (critical operation)
router.put('/:orgId', requireRole('SUPER_ADMIN'), updateConfig);

// Reset configuration to defaults - Super Admin only (critical operation)
router.post('/:orgId/reset', requireRole('SUPER_ADMIN'), resetToDefaults);

// ========== SPECIFIC SECTION UPDATES ==========
// Super Admin only for all configuration changes

// Update attendance timing rules
router.put('/:orgId/attendance-timing', requireRole('SUPER_ADMIN'), updateAttendanceTiming);

// Update deduction rules
router.put('/:orgId/deductions', requireRole('SUPER_ADMIN'), updateDeductions);

// Update leave policy
router.put('/:orgId/leave-policy', requireRole('SUPER_ADMIN'), updateLeavePolicy);

// Update working days
router.put('/:orgId/working-days', requireRole('SUPER_ADMIN'), updateWorkingDays);

// Update QR code settings
router.put('/:orgId/qr-settings', requireRole('SUPER_ADMIN'), updateQRSettings);

// Update grace period
router.put('/:orgId/grace-period', requireRole('SUPER_ADMIN'), updateGracePeriod);

// ========== UTILITY ROUTES ==========
// HR and Super Admin can use utility functions

// Check attendance status for a given time
router.post('/:orgId/check-status', requireRole('HR_ADMIN', 'SUPER_ADMIN'), checkAttendanceStatus);

// Calculate deductions based on late/half-day counts
router.post('/:orgId/calculate-deductions', requireRole('HR_ADMIN', 'SUPER_ADMIN'), calculateDeductions);

export default router;
