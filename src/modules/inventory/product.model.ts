/**
 * Product Model (MongoDB / Mongoose)
 * ================================================
 * Product catalog with barcode support, price tiers,
 * stock tracking, and GST information.
 * Stored in MongoDB for flexible schema evolution.
 * 
 * Developed by: Om Chauhan
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  price: {
    mrp: number;
    sellingPrice: number;
    costPrice: number;
  };
  stock: {
    current: number;
    minimum: number;
    maximum: number;
  };
  unit: string;
  images: string[];
  shopkeeperId: string;
  gstRate: number;
  hsnCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    price: {
      mrp: {
        type: Number,
        required: [true, 'MRP is required'],
        min: 0,
      },
      sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: 0,
      },
      costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: 0,
      },
    },
    stock: {
      current: {
        type: Number,
        default: 0,
        min: 0,
      },
      minimum: {
        type: Number,
        default: 5,
        min: 0,
      },
      maximum: {
        type: Number,
        default: 1000,
        min: 0,
      },
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'g', 'piece', 'litre', 'ml', 'dozen', 'pack', 'box', 'metre', 'cm'],
      default: 'piece',
    },
    images: {
      type: [String],
      default: [],
    },
    shopkeeperId: {
      type: String,
      required: [true, 'Shopkeeper ID is required'],
      index: true,
    },
    gstRate: {
      type: Number,
      default: 0,
      enum: [0, 5, 12, 18, 28], // Standard GST slabs in India
    },
    hsnCode: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index: barcode unique per shopkeeper
productSchema.index({ barcode: 1, shopkeeperId: 1 }, { unique: true, sparse: true });

// Search indexes
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ sku: 1, shopkeeperId: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

// Virtual: profit margin
productSchema.virtual('profitMargin').get(function (this: IProduct) {
  if (this.price.costPrice === 0) return 0;
  return (((this.price.sellingPrice - this.price.costPrice) / this.price.costPrice) * 100).toFixed(2);
});

// Virtual: is low stock
productSchema.virtual('isLowStock').get(function (this: IProduct) {
  return this.stock.current <= this.stock.minimum;
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
