/**
 * Notification Routes
 * ================================================
 * User notification management endpoints.
 * All routes require authentication.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { notificationController } from './notification.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { notificationListQuerySchema } from './notification.schema';

const router = Router();

// List my notifications
router.get(
  '/',
  authenticate,
  validate({ query: notificationListQuerySchema }),
  notificationController.listNotifications.bind(notificationController)
);

// Unread count (badge)
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount.bind(notificationController)
);

// Mark all as read
router.patch(
  '/read-all',
  authenticate,
  notificationController.markAllAsRead.bind(notificationController)
);

// Mark single as read
router.patch(
  '/:id/read',
  authenticate,
  notificationController.markAsRead.bind(notificationController)
);

// Delete notification
router.delete(
  '/:id',
  authenticate,
  notificationController.deleteNotification.bind(notificationController)
);

export default router;
