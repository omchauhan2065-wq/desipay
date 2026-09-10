/**
 * Database Configuration
 * ================================================
 * PostgreSQL (Prisma) + MongoDB (Mongoose) connections
 * with proper error handling and graceful shutdown.
 * 
 * Developed by: Om Chauhan
 */

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

/**
 * Connect to MongoDB
 */
export async function connectMongoDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
}

export default {
  connectMongoDB,
  disconnectMongoDB,
};
