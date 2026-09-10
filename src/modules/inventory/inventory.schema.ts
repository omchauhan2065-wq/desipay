/**
 * Inventory Validation Schemas (Zod)
 * ================================================
 * Zod schemas for product CRUD, stock management,
 * and barcode lookup operations.
 * 
 * Developed by: Om Chauhan
 */

import { z } from 'zod';

/**
 * Create product
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200).trim(),
  description: z.string().max(1000).optional(),
  sku: z.string().min(1, 'SKU is required').max(50).trim().toUpperCase(),
  barcode: z.string().max(50).optional(),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  subcategory: z.string().max(100).optional(),
  price: z.object({
    mrp: z.number().nonnegative('MRP must be non-negative'),
    sellingPrice: z.number().nonnegative('Selling price must be non-negative'),
    costPrice: z.number().nonnegative('Cost price must be non-negative'),
  }),
  stock: z.object({
    current: z.number().int().nonnegative().default(0),
    minimum: z.number().int().nonnegative().default(5),
    maximum: z.number().int().nonnegative().default(1000),
  }).default({ current: 0, minimum: 5, maximum: 1000 }),
  unit: z.enum(['kg', 'g', 'piece', 'litre', 'ml', 'dozen', 'pack', 'box', 'metre', 'cm']).default('piece'),
  gstRate: z.number().refine((v) => [0, 5, 12, 18, 28].includes(v), 'Invalid GST rate').default(0),
  hsnCode: z.string().max(20).optional(),
});

/**
 * Update product (partial)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Stock update
 */
export const stockUpdateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  action: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE'], {
    message: 'Action is required',
  }),
  reason: z.string().max(500).optional(),
});

/**
 * Barcode lookup
 */
export const barcodeLookupSchema = z.object({
  code: z.string().min(1, 'Barcode is required'),
});

/**
 * Inventory list query
 */
export const inventoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  search: z.string().optional(),
  stockFilter: z.enum(['all', 'low', 'out']).default('all'),
  sortBy: z.enum(['name', 'createdAt', 'stock.current', 'price.sellingPrice']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;
export type BarcodeLookupInput = z.infer<typeof barcodeLookupSchema>;
export type InventoryListQuery = z.infer<typeof inventoryListQuerySchema>;
