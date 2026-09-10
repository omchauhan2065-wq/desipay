/**
 * Payment Controller
 * ================================================
 * HTTP handlers for payment operations.
 * Follows the same thin-controller pattern as auth.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { paymentService } from './payment.service';
import { checkRazorpayHealth } from '../../config/razorpay';
import type {
  CreateOrderInput,
  VerifyPaymentInput,
  RefundInput,
  PaymentListQuery,
} from './payment.schema';

export class PaymentController {
  /**
   * POST /api/v1/payments/order
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateOrderInput = req.body;
      const result = await paymentService.createOrder(req.user!.userId, input);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Payment order created. Proceed to Razorpay checkout.',
        data: {
          paymentId: result.payment.id,
          razorpayOrderId: result.razorpayOrder.id,
          amount: result.razorpayOrder.amount,
          currency: result.razorpayOrder.currency,
          receipt: result.payment.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/verify
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: VerifyPaymentInput = req.body;
      const payment = await paymentService.verifyPayment(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment verified successfully',
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   * NOTE: No authentication — uses Razorpay webhook signature instead
   */
  async handleWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = JSON.stringify(req.body);

      await paymentService.processWebhook(rawBody, signature);

      // Always return 200 to Razorpay (even on errors, to prevent retries)
      res.status(StatusCodes.OK).json({ status: 'ok' });
    } catch (error) {
      // Log but still return 200 to prevent Razorpay retry storms
      res.status(StatusCodes.OK).json({ status: 'error_logged' });
    }
  }

  /**
   * POST /api/v1/payments/refund
   */
  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: RefundInput = req.body;
      const refund = await paymentService.initiateRefund(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Refund initiated successfully',
        data: { refund },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments
   */
  async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: PaymentListQuery = req.query as any;
      const result = await paymentService.getPaymentHistory(req.user!.userId, query);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/:id
   */
  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentService.getPaymentById(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { payment },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/payments/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    const health = await checkRazorpayHealth();
    res.status(StatusCodes.OK).json({
      success: true,
      data: { service: 'payment', razorpay: health },
    });
  }
}

export const paymentController = new PaymentController();
