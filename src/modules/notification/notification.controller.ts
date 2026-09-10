/**
 * Notification Controller
 * ================================================
 * HTTP handlers for notification endpoints.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { notificationService } from './notification.service';
import type { NotificationListQuery } from './notification.schema';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  async listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: NotificationListQuery = req.query as any;
      const result = await notificationService.getUserNotifications(req.user!.userId, query);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAsRead(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.deleteNotification(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Notification deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
