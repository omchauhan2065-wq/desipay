/**
 * Delivery & Orders Routes
 * ================================================
 * Quick Commerce (Blinkit-speed campus deliveries)
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { deliveryController } from './delivery.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema } from './delivery.schema';

const router = Router();

// Create quick-commerce delivery order
router.post(
  '/',
  authenticate,
  validate({ body: createOrderSchema }),
  deliveryController.createOrder.bind(deliveryController)
);

// Get my orders
router.get(
  '/',
  authenticate,
  deliveryController.getMyOrders.bind(deliveryController)
);

// Delivery analytics / stats
router.get(
  '/stats/summary',
  deliveryController.getStats.bind(deliveryController)
);

// Get order details
router.get(
  '/:id',
  authenticate,
  deliveryController.getOrder.bind(deliveryController)
);

// Update order status (Staff / Shopkeeper / Rider)
router.patch(
  '/:id/status',
  authenticate,
  validate({ body: updateOrderStatusSchema }),
  deliveryController.updateStatus.bind(deliveryController)
);

export default router;
