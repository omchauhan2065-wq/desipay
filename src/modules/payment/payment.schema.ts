/**
 * Payment Validation Schemas (Zod)
 * ================================================
 * All payment request bodies validated before
 * reaching the controller.
 * 
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

/**
 * Create Razorpay order
 */
export const createOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(10000000, 'Amount exceeds limit'),
  currency: z.string().default('INR'),
  receipt: z.string().max(40).optional(),
  description: z.string().max(255).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Verify payment after Razorpay checkout
 */
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

/**
 * Initiate refund
 */
export const refundSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  amount: z.number().positive('Amount must be positive').optional(), // Partial refund
  reason: z.string().max(255).optional(),
});

/**
 * List payments query
 */
export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;
