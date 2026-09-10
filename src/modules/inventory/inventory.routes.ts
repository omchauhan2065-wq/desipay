/**
 * Inventory Routes
 * ================================================
 * Product management and stock operations.
 * Shopkeeper-only with RBAC enforcement.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { UserRole } from '../../config/security';
import {
  createProductSchema,
  updateProductSchema,
  stockUpdateSchema,
  inventoryListQuerySchema,
} from './inventory.schema';

const router = Router();

// Health check
router.get('/health', inventoryController.healthCheck.bind(inventoryController));

// Product CRUD
router.post(
  '/products',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: createProductSchema }),
  inventoryController.createProduct.bind(inventoryController)
);

router.put(
  '/products/:id',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: updateProductSchema }),
  inventoryController.updateProduct.bind(inventoryController)
);

router.delete(
  '/products/:id',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  inventoryController.deleteProduct.bind(inventoryController)
);

router.get(
  '/products',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ query: inventoryListQuerySchema }),
  inventoryController.listProducts.bind(inventoryController)
);

router.get(
  '/products/:id',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  inventoryController.getProduct.bind(inventoryController)
);

// Barcode lookup
router.get(
  '/barcode/:code',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  inventoryController.lookupBarcode.bind(inventoryController)
);

// Stock management
router.post(
  '/stock',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: stockUpdateSchema }),
  inventoryController.updateStock.bind(inventoryController)
);

router.get(
  '/low-stock',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  inventoryController.getLowStock.bind(inventoryController)
);

router.get(
  '/stock-history/:id',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  inventoryController.getStockHistory.bind(inventoryController)
);

export default router;
