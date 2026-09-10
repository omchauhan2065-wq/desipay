/**
 * Khata Controller
 * ================================================
 * HTTP handlers for Khata Book operations.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { khataService } from './khata.service';
import type {
  CreateKhataEntryInput,
  SettleKhataInput,
  KhataListQuery,
  SendReminderInput,
} from './khata.schema';

export class KhataController {
  /**
   * POST /api/v1/khata/entry
   */
  async createEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateKhataEntryInput = req.body;
      const entry = await khataService.createEntry(req.user!.userId, input);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: `Khata ${input.entryType.toLowerCase()} entry recorded`,
        data: { entry },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/khata/settle
   */
  async settleEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: SettleKhataInput = req.body;
      const result = await khataService.settleEntries(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `${result.settled} entries settled. Remaining balance: ₹${result.remainingBalance.toFixed(2)}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/khata/ledger/:custId
   */
  async getCustomerLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: KhataListQuery = req.query as any;
      const result = await khataService.getCustomerLedger(
        req.user!.userId,
        req.params.custId as string,
        query
      );

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/khata/balance/:custId
   */
  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await khataService.getBalance(req.user!.userId, req.params.custId as string);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/khata/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await khataService.getDashboard(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/khata/my-udhar
   */
  async getMyUdhar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: KhataListQuery = req.query as any;
      const result = await khataService.getMyUdhar(req.user!.userId, query);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/khata/reminder
   */
  async sendReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: SendReminderInput = req.body;
      await khataService.sendReminder(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Payment reminder sent to customer',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/khata/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(StatusCodes.OK).json({
      success: true,
      data: { service: 'khata', status: 'healthy' },
    });
  }
}

export const khataController = new KhataController();
