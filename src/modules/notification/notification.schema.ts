/**
 * Notification Validation Schemas (Zod)
 * ================================================
 * Schemas for notification endpoints.
 * 
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

/**
 * Send notification (internal use — called by other services)
 */
export const sendNotificationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  channel: z.enum(['PUSH', 'SMS', 'WHATSAPP', 'EMAIL']).default('PUSH'),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * List notifications query
 */
export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isRead: z.enum(['true', 'false']).optional(),
});

/**
 * Mark notifications as read
 */
export const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

// Export types
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
