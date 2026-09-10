/**
 * Khata Routes
 * ================================================
 * Digital Khata Book endpoints with RBAC enforcement.
 * Shopkeepers manage entries; customers view their credit.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { khataController } from './khata.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { UserRole } from '../../config/security';
import {
  createKhataEntrySchema,
  settleKhataSchema,
  khataListQuerySchema,
  sendReminderSchema,
} from './khata.schema';

const router = Router();

// Health check
router.get('/health', khataController.healthCheck.bind(khataController));

// Shopkeeper-only routes
router.post(
  '/entry',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: createKhataEntrySchema }),
  khataController.createEntry.bind(khataController)
);

router.post(
  '/settle',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: settleKhataSchema }),
  khataController.settleEntries.bind(khataController)
);

router.get(
  '/ledger/:custId',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ query: khataListQuerySchema }),
  khataController.getCustomerLedger.bind(khataController)
);

router.get(
  '/balance/:custId',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  khataController.getBalance.bind(khataController)
);

router.get(
  '/dashboard',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  khataController.getDashboard.bind(khataController)
);

router.post(
  '/reminder',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: sendReminderSchema }),
  khataController.sendReminder.bind(khataController)
);

// Customer route — view my own credit
router.get(
  '/my-udhar',
  authenticate,
  validate({ query: khataListQuerySchema }),
  khataController.getMyUdhar.bind(khataController)
);

export default router;
