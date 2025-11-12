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

const router = express.Router();

// ========== MAIN CONFIG ROUTES ==========

// Get organization configuration
router.get('/:orgId', getConfig);

// Update entire configuration
router.put('/:orgId', updateConfig);

// Reset configuration to defaults
router.post('/:orgId/reset', resetToDefaults);

// ========== SPECIFIC SECTION UPDATES ==========

// Update attendance timing rules
router.put('/:orgId/attendance-timing', updateAttendanceTiming);

// Update deduction rules
router.put('/:orgId/deductions', updateDeductions);

// Update leave policy
router.put('/:orgId/leave-policy', updateLeavePolicy);

// Update working days
router.put('/:orgId/working-days', updateWorkingDays);

// Update QR code settings
router.put('/:orgId/qr-settings', updateQRSettings);

// Update grace period
router.put('/:orgId/grace-period', updateGracePeriod);

// ========== UTILITY ROUTES ==========

// Check attendance status for a given time
router.post('/:orgId/check-status', checkAttendanceStatus);

// Calculate deductions based on late/half-day counts
router.post('/:orgId/calculate-deductions', calculateDeductions);

export default router;
