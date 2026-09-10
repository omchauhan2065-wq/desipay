/**
 * User Routes
 * ================================================
 * Profile viewing, updating, and administrative operations.
 * Protected by JWT authentication and RBAC.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../../config/security';
import {
  updateCustomerProfileSchema,
  updateShopkeeperProfileSchema,
  updateB2bProfileSchema,
} from '../auth/auth.schema';

const router = Router();

// Profile retrieval
router.get(
  '/profile',
  authenticate,
  userController.getProfile.bind(userController)
);

// Customer profile update
router.put(
  '/profile/customer',
  authenticate,
  authorize(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: updateCustomerProfileSchema }),
  userController.updateCustomerProfile.bind(userController)
);

// Shopkeeper profile update
router.put(
  '/profile/shopkeeper',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: updateShopkeeperProfileSchema }),
  userController.updateShopkeeperProfile.bind(userController)
);

// B2B profile update
router.put(
  '/profile/b2b',
  authenticate,
  authorize(UserRole.B2B_CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: updateB2bProfileSchema }),
  userController.updateB2bProfile.bind(userController)
);

// Administrative user listing
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userController.listUsers.bind(userController)
);

export default router;
