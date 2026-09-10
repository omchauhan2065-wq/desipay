/**
 * Delivery & Quick-Commerce Order Schemas
 * ================================================
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least 1 item'),
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  deliveryLocation: z.string().min(1, 'Delivery location is required'),
  deliveryNote: z.string().optional(),
  estimatedMinutes: z.number().int().positive().default(8),
  paymentId: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
