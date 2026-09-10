/**
 * Delivery & Quick Commerce Order Controller
 * ================================================
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { deliveryService } from './delivery.service';
import type { CreateOrderInput, UpdateOrderStatusInput } from './delivery.schema';

export class DeliveryController {
  /**
   * POST /api/v1/orders
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateOrderInput = req.body;
      const order = await deliveryService.createOrder(req.user!.userId, input);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: `⚡ Order #${order.orderNumber} placed! Delivery in ~${order.estimatedMinutes} mins to ${order.deliveryLocation}`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders
   */
  async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await deliveryService.getUserOrders(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { orders },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/:id
   */
  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const order = await deliveryService.getOrderById(orderId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/orders/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = String(req.params.id);
      const input: UpdateOrderStatusInput = req.body;
      const order = await deliveryService.updateOrderStatus(orderId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Order status updated to ${order.status}`,
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/orders/stats/summary
   */
  async getStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await deliveryService.getDeliveryStats();

      res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const deliveryController = new DeliveryController();
