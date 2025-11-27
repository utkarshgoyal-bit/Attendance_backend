import express from 'express';
import {
  createOrganization,
  getAllOrganizations,
  getOrganization,
  updateOrganization,
  toggleOrganizationStatus,
  deleteOrganization,
  getMyOrganization
} from '../controllers/organizationController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========== SUPER ADMIN ROUTES ==========
router.post('/', requireRole('SUPER_ADMIN'), createOrganization);
router.get('/', requireRole('SUPER_ADMIN'), getAllOrganizations);
router.get('/:id', requireRole('SUPER_ADMIN'), getOrganization);
router.put('/:id', requireRole('SUPER_ADMIN'), updateOrganization);
router.patch('/:id/toggle', requireRole('SUPER_ADMIN'), toggleOrganizationStatus);
router.delete('/:id', requireRole('SUPER_ADMIN'), deleteOrganization);

// ========== ORG ADMIN ROUTES ==========
router.get('/my/organization', requireRole('HR_ADMIN', 'SUPER_ADMIN'), getMyOrganization);

export default router;
