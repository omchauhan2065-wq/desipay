/**
 * Inventory Service
 * ================================================
 * Product CRUD (MongoDB), stock management with
 * PostgreSQL InventoryLog, and barcode lookup.
 * Cross-module: notifies on low stock.
 * 
 * Developed by: Om Chauhan
 */

import { prisma } from '../../config/prisma';
import { Product, IProduct } from './product.model';
import { logger } from '../../config/logger';
import { AuditAction } from '../../config/security';
import { auditService } from '../audit/audit.service';
import { notificationService } from '../notification/notification.service';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors';
import type {
  CreateProductInput,
  UpdateProductInput,
  StockUpdateInput,
  InventoryListQuery,
} from './inventory.schema';

export class InventoryService {
  /**
   * Create a new product
   */
  async createProduct(shopkeeperId: string, input: CreateProductInput): Promise<IProduct> {
    // Check for duplicate SKU
    const existing = await Product.findOne({
      sku: input.sku,
      shopkeeperId,
    });

    if (existing) {
      throw new BadRequestError(`Product with SKU ${input.sku} already exists`);
    }

    // Check for duplicate barcode
    if (input.barcode) {
      const barcodeExists = await Product.findOne({
        barcode: input.barcode,
        shopkeeperId,
      });
      if (barcodeExists) {
        throw new BadRequestError(`Product with barcode ${input.barcode} already exists`);
      }
    }

    const product = await Product.create({
      ...input,
      shopkeeperId,
    });

    // Log initial stock
    if (input.stock && input.stock.current > 0) {
      await prisma.inventoryLog.create({
        data: {
          productId: product._id.toString(),
          userId: shopkeeperId,
          action: 'STOCK_IN',
          quantity: input.stock.current,
          prevStock: 0,
          newStock: input.stock.current,
          reason: 'Initial stock on product creation',
        },
      });
    }

    await auditService.log({
      userId: shopkeeperId,
      action: AuditAction.STOCK_UPDATED,
      resourceType: 'PRODUCT',
      resourceId: product._id.toString(),
      metadata: { name: product.name, sku: product.sku },
    });

    logger.info('Product created', {
      productId: product._id,
      name: product.name,
      sku: product.sku,
    });

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(
    shopkeeperId: string,
    productId: string,
    input: UpdateProductInput
  ): Promise<IProduct> {
    const product = await Product.findOneAndUpdate(
      { _id: productId, shopkeeperId, isActive: true },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    await auditService.log({
      userId: shopkeeperId,
      action: AuditAction.PROFILE_UPDATED,
      resourceType: 'PRODUCT',
      resourceId: productId,
      metadata: { updatedFields: Object.keys(input) },
    });

    return product;
  }

  /**
   * Soft delete product
   */
  async deleteProduct(shopkeeperId: string, productId: string): Promise<void> {
    const product = await Product.findOneAndUpdate(
      { _id: productId, shopkeeperId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    logger.info('Product soft deleted', { productId, name: product.name });
  }

  /**
   * Get products (paginated, filterable)
   */
  async getProducts(shopkeeperId: string, query: InventoryListQuery): Promise<{
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: any = { shopkeeperId, isActive: true };

    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.stockFilter === 'low') {
      filter.$expr = { $lte: ['$stock.current', '$stock.minimum'] };
    } else if (query.stockFilter === 'out') {
      filter['stock.current'] = 0;
    }

    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products: products as IProduct[],
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  /**
   * Get single product
   */
  async getProductById(shopkeeperId: string, productId: string): Promise<IProduct> {
    const product = await Product.findOne({
      _id: productId,
      shopkeeperId,
      isActive: true,
    });

    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  /**
   * Lookup product by barcode
   */
  async lookupBarcode(shopkeeperId: string, barcode: string): Promise<IProduct | null> {
    const product = await Product.findOne({
      barcode,
      shopkeeperId,
      isActive: true,
    });

    return product;
  }

  /**
   * Update stock with atomic operation and history logging
   */
  async updateStock(shopkeeperId: string, input: StockUpdateInput): Promise<{
    product: IProduct;
    log: any;
  }> {
    const product = await Product.findOne({
      _id: input.productId,
      shopkeeperId,
      isActive: true,
    });

    if (!product) throw new NotFoundError('Product not found');

    const prevStock = product.stock.current;
    let newStock: number;

    switch (input.action) {
      case 'STOCK_IN':
        newStock = prevStock + input.quantity;
        break;
      case 'STOCK_OUT':
      case 'SALE':
        if (prevStock < input.quantity) {
          throw new BadRequestError(`Insufficient stock. Available: ${prevStock}`);
        }
        newStock = prevStock - input.quantity;
        break;
      case 'ADJUSTMENT':
        newStock = input.quantity; // Direct set
        break;
      default:
        throw new BadRequestError('Invalid stock action');
    }

    // Atomic update in MongoDB
    product.stock.current = newStock;
    await product.save();

    // Log in PostgreSQL
    const log = await prisma.inventoryLog.create({
      data: {
        productId: input.productId,
        userId: shopkeeperId,
        action: input.action,
        quantity: input.quantity,
        prevStock,
        newStock,
        reason: input.reason,
      },
    });

    // Check low stock alert
    if (newStock <= product.stock.minimum && newStock > 0) {
      await notificationService.send({
        userId: shopkeeperId,
        channel: 'PUSH',
        title: '⚠️ Low Stock Alert',
        message: `"${product.name}" is running low (${newStock} ${product.unit} remaining). Minimum: ${product.stock.minimum}`,
        metadata: { productId: input.productId, stock: newStock },
      });
    } else if (newStock === 0) {
      await notificationService.send({
        userId: shopkeeperId,
        channel: 'PUSH',
        title: '🚨 Out of Stock',
        message: `"${product.name}" is now OUT OF STOCK!`,
        metadata: { productId: input.productId },
      });
    }

    await auditService.log({
      userId: shopkeeperId,
      action: AuditAction.STOCK_UPDATED,
      resourceType: 'PRODUCT',
      resourceId: input.productId,
      metadata: { action: input.action, prevStock, newStock, quantity: input.quantity },
    });

    logger.info('Stock updated', {
      productId: input.productId,
      action: input.action,
      prevStock,
      newStock,
    });

    return { product, log };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(shopkeeperId: string): Promise<IProduct[]> {
    const products = await Product.find({
      shopkeeperId,
      isActive: true,
      $expr: { $lte: ['$stock.current', '$stock.minimum'] },
    })
      .sort({ 'stock.current': 1 })
      .lean();

    return products as IProduct[];
  }

  /**
   * Get stock history for a product
   */
  async getStockHistory(shopkeeperId: string, productId: string): Promise<any[]> {
    // Verify ownership
    const product = await Product.findOne({ _id: productId, shopkeeperId });
    if (!product) throw new NotFoundError('Product not found');

    return prisma.inventoryLog.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

export const inventoryService = new InventoryService();
