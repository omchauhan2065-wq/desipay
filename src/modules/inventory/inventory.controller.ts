/**
 * Inventory Controller
 * ================================================
 * HTTP handlers for product and stock operations.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { inventoryService } from './inventory.service';
import type {
  CreateProductInput,
  UpdateProductInput,
  StockUpdateInput,
  InventoryListQuery,
} from './inventory.schema';

export class InventoryController {
  /**
   * POST /api/v1/inventory/products
   */
  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateProductInput = req.body;
      const product = await inventoryService.createProduct(req.user!.userId, input);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/inventory/products/:id
   */
  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: UpdateProductInput = req.body;
      const product = await inventoryService.updateProduct(
        req.user!.userId,
        req.params.id as string,
        input
      );

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Product updated',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/inventory/products/:id
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await inventoryService.deleteProduct(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Product deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/products
   */
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query: InventoryListQuery = req.query as any;
      const result = await inventoryService.getProducts(req.user!.userId, query);

      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/products/:id
   */
  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await inventoryService.getProductById(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/barcode/:code
   */
  async lookupBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await inventoryService.lookupBarcode(req.user!.userId, req.params.code as string);

      if (!product) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: 'No product found with this barcode' },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/inventory/stock
   */
  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: StockUpdateInput = req.body;
      const result = await inventoryService.updateStock(req.user!.userId, input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `Stock ${input.action.toLowerCase().replace('_', ' ')} recorded`,
        data: {
          product: {
            id: result.product._id,
            name: result.product.name,
            stock: result.product.stock,
          },
          log: result.log,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/low-stock
   */
  async getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await inventoryService.getLowStockAlerts(req.user!.userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { products, count: products.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/stock-history/:id
   */
  async getStockHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await inventoryService.getStockHistory(req.user!.userId, req.params.id as string);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/inventory/health
   */
  async healthCheck(_req: Request, res: Response): Promise<void> {
    res.status(StatusCodes.OK).json({
      success: true,
      data: { service: 'inventory', status: 'healthy' },
    });
  }
}

export const inventoryController = new InventoryController();
