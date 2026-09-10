/**
 * Redis Configuration
 * ================================================
 * Redis client for sessions, caching, rate limiting,
 * and job queue management.
 * 
 * Developed by: Om Chauhan
 */

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redisClient: Redis | null = null;

/**
 * Create and return Redis connection
 */
export function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const retryStrategy = (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  };

  if (env.REDIS_URL) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy,
      lazyConnect: true,
    });
  } else {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      db: env.REDIS_DB,
      maxRetriesPerRequest: 3,
      retryStrategy,
      lazyConnect: true,
    });
  }

  redisClient.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return redisClient;
}

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Redis is not critical for app startup in development
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

/**
 * Disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected gracefully');
  }
}

export default { getRedisClient, connectRedis, disconnectRedis };
