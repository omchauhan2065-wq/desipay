/**
 * Notification Service
 * ================================================
 * Multi-channel notification delivery: PUSH (in-app),
 * SMS (Twilio/mock), Email (nodemailer).
 * Called by Payment, Khata, and Inventory modules.
 * 
 * Developed by: Om Chauhan
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import type { SendNotificationInput, NotificationListQuery } from './notification.schema';

export class NotificationService {
  /**
   * Send a single notification
   */
  async send(input: SendNotificationInput): Promise<any> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: input.userId,
          channel: input.channel,
          title: input.title,
          message: input.message,
          metadata: (input.metadata as any) || {},
          sentAt: new Date(),
        },
      });

      // Dispatch to channel
      await this.dispatch(input);

      logger.debug('Notification sent', {
        notificationId: notification.id,
        userId: input.userId,
        channel: input.channel,
        title: input.title,
      });

      return notification;
    } catch (error: any) {
      // Non-critical: log but don't throw
      logger.error('Failed to send notification', {
        error: error.message,
        userId: input.userId,
        channel: input.channel,
      });
      return null;
    }
  }

  /**
   * Send bulk notifications (e.g., khata reminders)
   */
  async sendBulk(inputs: SendNotificationInput[]): Promise<number> {
    let sent = 0;
    for (const input of inputs) {
      const result = await this.send(input);
      if (result) sent++;
    }
    return sent;
  }

  /**
   * Get user's notifications (paginated)
   */
  async getUserNotifications(userId: string, query: NotificationListQuery): Promise<{
    notifications: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = { userId };
    if (query.isRead !== undefined) {
      where.isRead = query.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          channel: true,
          title: true,
          message: true,
          isRead: true,
          metadata: true,
          sentAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get unread count for badge
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  /**
   * Dispatch notification to external channel
   */
  private async dispatch(input: SendNotificationInput): Promise<void> {
    switch (input.channel) {
      case 'PUSH':
        // In-app push — already stored in DB, frontend polls/uses SSE
        break;

      case 'SMS':
        await this.sendSms(input);
        break;

      case 'EMAIL':
        await this.sendEmail(input);
        break;

      case 'WHATSAPP':
        // WhatsApp API integration placeholder
        logger.info('WhatsApp notification queued (not implemented)', {
          userId: input.userId,
        });
        break;
    }
  }

  /**
   * Send SMS via configured provider
   */
  private async sendSms(input: SendNotificationInput): Promise<void> {
    // In dev mode, just log the SMS
    logger.info('📱 SMS notification', {
      userId: input.userId,
      title: input.title,
      message: input.message.substring(0, 100),
    });

    // TODO: Integrate Twilio/MSG91 for production
    // const twilio = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({ body: input.message, from: env.TWILIO_PHONE_NUMBER, to: phoneNumber });
  }

  /**
   * Send Email via nodemailer
   */
  private async sendEmail(input: SendNotificationInput): Promise<void> {
    // In dev mode, just log the email
    logger.info('📧 Email notification', {
      userId: input.userId,
      title: input.title,
      message: input.message.substring(0, 100),
    });

    // TODO: Integrate nodemailer for production
    // const transporter = nodemailer.createTransport({ host: env.SMTP_HOST, ... });
    // await transporter.sendMail({ to: email, subject: input.title, text: input.message });
  }
}

export const notificationService = new NotificationService();
