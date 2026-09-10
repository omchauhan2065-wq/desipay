/**
 * Payment Routes
 * ================================================
 * Payment endpoints with auth, rate limiting,
 * and Zod validation. Webhook endpoint is unauthed
 * but uses Razorpay signature verification.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { generalRateLimiter } from '../../middleware/rateLimiter.middleware';
import { UserRole } from '../../config/security';
import {
  createOrderSchema,
  verifyPaymentSchema,
  refundSchema,
  paymentListQuerySchema,
} from './payment.schema';

const router = Router();

// Health check (public)
router.get(
  '/health',
  paymentController.healthCheck.bind(paymentController)
);

// Create Razorpay order
router.post(
  '/order',
  authenticate,
  generalRateLimiter,
  validate({ body: createOrderSchema }),
  paymentController.createOrder.bind(paymentController)
);

// Verify payment after checkout
router.post(
  '/verify',
  authenticate,
  validate({ body: verifyPaymentSchema }),
  paymentController.verifyPayment.bind(paymentController)
);

// Razorpay webhook (NO auth — signature-verified)
router.post(
  '/webhook',
  paymentController.handleWebhook.bind(paymentController)
);

// Initiate refund (Shopkeeper or Admin only)
router.post(
  '/refund',
  authenticate,
  authorize(UserRole.SHOPKEEPER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validate({ body: refundSchema }),
  paymentController.refund.bind(paymentController)
);

// List user payments
router.get(
  '/',
  authenticate,
  validate({ query: paymentListQuerySchema }),
  paymentController.listPayments.bind(paymentController)
);

// Get single payment
router.get(
  '/:id',
  authenticate,
  paymentController.getPayment.bind(paymentController)
);

export default router;
