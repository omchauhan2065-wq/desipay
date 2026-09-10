/**
 * Khata Validation Schemas (Zod)
 * ================================================
 * Zod schemas for digital Khata Book operations:
 * Udhar/Nagdi entries, settlements, and reminders.
 * 
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

/**
 * Create khata entry (Udhar or Nagdi)
 */
export const createKhataEntrySchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z.number().positive('Amount must be positive'),
  entryType: z.enum(['CREDIT', 'DEBIT'], {
    message: 'Entry type must be CREDIT (udhar diya) or DEBIT (paisa liya)',
  }),
  description: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional(),
});

/**
 * Settle khata entries
 */
export const settleKhataSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'NETBANKING', 'WALLET', 'BANK_TRANSFER']).default('CASH'),
  description: z.string().max(500).optional(),
});

/**
 * Query khata entries
 */
export const khataListQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  isSettled: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Send payment reminder
 */
export const sendReminderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  channel: z.enum(['PUSH', 'SMS', 'WHATSAPP', 'EMAIL']).default('PUSH'),
  message: z.string().max(500).optional(),
});

// Export types
export type CreateKhataEntryInput = z.infer<typeof createKhataEntrySchema>;
export type SettleKhataInput = z.infer<typeof settleKhataSchema>;
export type KhataListQuery = z.infer<typeof khataListQuerySchema>;
export type SendReminderInput = z.infer<typeof sendReminderSchema>;
