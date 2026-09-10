/**
 * Payment Service
 * ================================================
 * Razorpay integration for order creation, payment
 * verification, webhook processing, and refunds.
 * Cross-module: creates Transactions and Notifications.
 * 
 * Developed by: Om Chauhan
 */

import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { getRazorpay, verifyRazorpaySignature, verifyWebhookSignature } from '../../config/razorpay';
import { logger, securityLogger } from '../../config/logger';
import { AuditAction } from '../../config/security';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notification/notification.service';
import {
  BadRequestError,
  NotFoundError,
  PaymentError,
} from '../../shared/errors';
import type {
  CreateOrderInput,
  VerifyPaymentInput,
  RefundInput,
  PaymentListQuery,
} from './payment.schema';

export class PaymentService {
  /**
   * Create a Razorpay order and record it locally
   */
  async createOrder(userId: string, input: CreateOrderInput): Promise<{
    payment: any;
    razorpayOrder: any;
  }> {
    const amountInPaise = Math.round(input.amount * 100);
    const receipt = input.receipt || `rcpt_${crypto.randomUUID().slice(0, 8)}`;

    let razorpayOrder: any;

    try {
      const rzp = getRazorpay();
      razorpayOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: input.currency || 'INR',
        receipt,
        notes: (input.metadata as any) || {},
      });
    } catch (error: any) {
      logger.error('Razorpay order creation failed', { error: error.message, userId });
      throw new PaymentError('Failed to create payment order. Please try again.');
    }

    // Save to our database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: input.amount,
        currency: input.currency || 'INR',
        status: 'PENDING',
        razorpayOrderId: razorpayOrder.id,
        receipt,
        description: input.description,
        metadata: (input.metadata as any) || {},
      },
    });

    await auditService.log({
      userId,
      action: AuditAction.PAYMENT_INITIATED,
      resourceType: 'PAYMENT',
      resourceId: payment.id,
      metadata: { razorpayOrderId: razorpayOrder.id, amount: input.amount },
    });

    logger.info('Payment order created', {
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount: input.amount,
    });

    return { payment, razorpayOrder };
  }

  /**
   * Verify payment after Razorpay checkout completes
   */
  async verifyPayment(userId: string, input: VerifyPaymentInput): Promise<any> {
    // 1. Verify HMAC signature
    const isValid = verifyRazorpaySignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature
    );

    if (!isValid) {
      securityLogger.error('Payment signature verification FAILED', {
        userId,
        razorpayOrderId: input.razorpayOrderId,
      });
      throw new PaymentError('Payment verification failed — signature mismatch');
    }

    // 2. Find our payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: input.razorpayOrderId },
    });

    if (!payment) {
      throw new NotFoundError('Payment order not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Payment does not belong to this user');
    }

    if (payment.status === 'COMPLETED') {
      return payment; // Already verified (idempotent)
    }

    // 3. Mark as completed
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paidAt: new Date(),
      },
    });

    // 4. Create linked Transaction record
    await prisma.transaction.create({
      data: {
        senderId: userId,
        receiverId: userId, // Self-payment for now (shopkeeper receives from gateway)
        amount: payment.amount,
        type: 'NAGDI',
        status: 'COMPLETED',
        paymentMethod: 'UPI', // Default, can be enhanced from Razorpay data
        referenceId: input.razorpayPaymentId,
        description: payment.description || 'Razorpay payment',
        metadata: {
          razorpayOrderId: input.razorpayOrderId,
          razorpayPaymentId: input.razorpayPaymentId,
        },
      },
    });

    // 5. Send notification
    await notificationService.send({
      userId,
      channel: 'PUSH',
      title: '✅ Payment Successful',
      message: `₹${payment.amount.toFixed(2)} payment confirmed. Ref: ${input.razorpayPaymentId.slice(-8)}`,
      metadata: { paymentId: payment.id },
    });

    await auditService.log({
      userId,
      action: AuditAction.PAYMENT_COMPLETED,
      resourceType: 'PAYMENT',
      resourceId: payment.id,
      metadata: {
        razorpayPaymentId: input.razorpayPaymentId,
        amount: payment.amount,
      },
    });

    logger.info('Payment verified successfully', {
      paymentId: payment.id,
      amount: payment.amount,
    });

    return updatedPayment;
  }

  /**
   * Process Razorpay webhook event (idempotent)
   */
  async processWebhook(rawBody: string, signature: string): Promise<void> {
    // 1. Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      securityLogger.error('Webhook signature verification FAILED');
      throw new BadRequestError('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || event.id;

    // 2. Idempotency check
    const existing = await prisma.paymentWebhookLog.findUnique({
      where: { eventId },
    });

    if (existing?.processed) {
      logger.info('Webhook already processed, skipping', { eventId });
      return;
    }

    // 3. Log the event
    await prisma.paymentWebhookLog.upsert({
      where: { eventId },
      update: {},
      create: {
        eventId,
        eventType: event.event,
        payload: event,
      },
    });

    // 4. Handle event types
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity) return;

    switch (event.event) {
      case 'payment.captured': {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: paymentEntity.order_id, status: 'PENDING' },
          data: {
            status: 'COMPLETED',
            razorpayPaymentId: paymentEntity.id,
            paymentMethod: this.mapPaymentMethod(paymentEntity.method),
            paidAt: new Date(),
          },
        });
        break;
      }
      case 'payment.failed': {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: paymentEntity.order_id },
          data: {
            status: 'FAILED',
            razorpayPaymentId: paymentEntity.id,
            failedAt: new Date(),
          },
        });

        // Notify user of failure
        const failedPayment = await prisma.payment.findFirst({
          where: { razorpayOrderId: paymentEntity.order_id },
        });
        if (failedPayment) {
          await notificationService.send({
            userId: failedPayment.userId,
            channel: 'PUSH',
            title: '❌ Payment Failed',
            message: `₹${failedPayment.amount.toFixed(2)} payment failed. Please try again.`,
            metadata: { paymentId: failedPayment.id },
          });
        }
        break;
      }
      case 'refund.processed': {
        const refundEntity = event.payload?.refund?.entity;
        if (refundEntity) {
          await prisma.payment.updateMany({
            where: { razorpayPaymentId: refundEntity.payment_id },
            data: {
              status: 'REFUNDED',
              refundedAmount: { increment: refundEntity.amount / 100 },
            },
          });
        }
        break;
      }
    }

    // 5. Mark as processed
    await prisma.paymentWebhookLog.update({
      where: { eventId },
      data: { processed: true, processedAt: new Date() },
    });

    logger.info('Webhook processed', { eventId, eventType: event.event });
  }

  /**
   * Initiate a refund
   */
  async initiateRefund(userId: string, input: RefundInput): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
    });

    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestError('Only completed payments can be refunded');
    }
    if (!payment.razorpayPaymentId) {
      throw new BadRequestError('No Razorpay payment ID found');
    }

    const refundAmount = input.amount || payment.amount;
    if (refundAmount > payment.amount - payment.refundedAmount) {
      throw new BadRequestError('Refund amount exceeds remaining refundable amount');
    }

    try {
      const rzp = getRazorpay();
      const refund = await rzp.payments.refund(payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
        notes: { reason: input.reason || 'Customer request' },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: { increment: refundAmount },
          status: refundAmount >= (payment.amount - payment.refundedAmount) ? 'REFUNDED' : 'COMPLETED',
        },
      });

      await notificationService.send({
        userId: payment.userId,
        channel: 'PUSH',
        title: '💸 Refund Initiated',
        message: `₹${refundAmount.toFixed(2)} refund is being processed.`,
        metadata: { paymentId: payment.id, refundId: refund.id },
      });

      await auditService.log({
        userId,
        action: 'REFUND_INITIATED',
        resourceType: 'PAYMENT',
        resourceId: payment.id,
        metadata: { refundAmount, razorpayRefundId: refund.id },
      });

      return refund;
    } catch (error: any) {
      logger.error('Refund initiation failed', { error: error.message });
      throw new PaymentError('Failed to process refund');
    }
  }

  /**
   * Get paginated payment history for a user
   */
  async getPaymentHistory(userId: string, query: PaymentListQuery): Promise<{
    payments: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: any = { userId };

    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          receipt: true,
          description: true,
          paidAt: true,
          refundedAmount: true,
          createdAt: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get single payment by ID
   */
  async getPaymentById(userId: string, paymentId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.userId !== userId) throw new BadRequestError('Access denied');

    return payment;
  }

  /**
   * Map Razorpay payment method to our enum
   */
  private mapPaymentMethod(method: string): any {
    const map: Record<string, string> = {
      upi: 'UPI',
      card: 'CARD',
      netbanking: 'NETBANKING',
      wallet: 'WALLET',
      bank_transfer: 'BANK_TRANSFER',
    };
    return map[method] || 'UPI';
  }
}

export const paymentService = new PaymentService();
