/**
 * Server Entry Point
 * ================================================
 * Starts the Express server with graceful shutdown
 * handling for all connections.
 * 
 * Developed by: Om Chauhan
 */

import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongoDB, disconnectMongoDB } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectPostgres, disconnectPostgres } from './config/prisma';
import http from 'http';

const server = http.createServer(app);

/**
 * Start the server and connect to all data stores
 */
async function startServer(): Promise<void> {
  try {
    logger.info('🚀 Starting DesiPay Server...');
    logger.info(`Environment: ${env.NODE_ENV}`);

    // Connect to PostgreSQL via Prisma
    await connectPostgres();

    // Connect to MongoDB
    await connectMongoDB();
    
    // Connect to Redis (non-critical in dev)
    try {
      await connectRedis();
    } catch (err) {
      logger.warn('Redis connection failed, continuing without Redis in development mode');
    }

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`✅ DesiPay API running on port ${env.PORT}`);
      logger.info(`📖 API Docs: ${env.APP_URL}/api-docs`);
      logger.info(`❤️ Health: ${env.APP_URL}/health`);
      logger.info(`🔐 Security: Helmet ✓ CORS ✓ Rate Limit ✓ HPP ✓`);
      logger.info('━'.repeat(50));
      logger.info('  Developed by: Om Chauhan');
      logger.info('  Mentored by: Antigravity AI');
      logger.info('━'.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown — close all connections cleanly
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Disconnect from databases
      await disconnectPostgres();
      await disconnectMongoDB();
      await disconnectRedis();
      
      logger.info('All connections closed. Goodbye! 👋');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30s timeout');
    process.exit(1);
  }, 30000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Don't crash — let the error handler deal with it
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // This is a programming error — must restart
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Start the server
startServer();
