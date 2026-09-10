/**
 * Prisma Client Singleton
 * ================================================
 * Single Prisma instance shared across the app.
 * Prevents multiple connections during hot reload.
 * 
 * Developed by: Om Chauhan
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

// Extend global to store prisma client during dev (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
  });

  // Log queries in development
  if (env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  prisma.$on('error', (e) => {
    logger.error('Prisma Error', { message: e.message });
  });

  prisma.$on('warn', (e) => {
    logger.warn('Prisma Warning', { message: e.message });
  });

  return prisma;
}

// Use singleton pattern for development (hot reload safe)
export const prisma: PrismaClient =
  env.NODE_ENV === 'production' ? createPrismaClient() : (global.__prisma ??= createPrismaClient());

/**
 * Connect to PostgreSQL via Prisma
 */
export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('⚠️ Running with in-memory fallback for local development until PostgreSQL is started');
    }
  }
}

/**
 * Disconnect Prisma
 */
export async function disconnectPostgres(): Promise<void> {
  await prisma.$disconnect();
  logger.info('PostgreSQL disconnected gracefully');
}

export default prisma;
