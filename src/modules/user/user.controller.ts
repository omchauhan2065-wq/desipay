/**
 * User Controller
 * ================================================
 * Handles HTTP requests for profile view/update
 * and administrative user queries.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userService } from './user.service';

export class UserController {
  /**
   * GET /api/v1/users/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await userService.getProfile(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { profile },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile/customer
   */
  async updateCustomerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await userService.updateCustomerProfile(userId, req.body);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Customer profile updated successfully',
        data: { profile: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile/shopkeeper
   */
  async updateShopkeeperProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await userService.updateShopkeeperProfile(userId, req.body);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Shopkeeper store profile updated successfully',
        data: { profile: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile/b2b
   */
  async updateB2bProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updated = await userService.updateB2bProfile(userId, req.body);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'B2B commercial profile updated successfully',
        data: { profile: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users (Admin only)
   */
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await userService.listUsers({ page, limit, role, search });

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
