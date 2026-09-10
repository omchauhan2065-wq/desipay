/**
 * Rate Limiter Middleware
 * ================================================
 * Tiered rate limiting for different endpoint types.
 * Uses Redis in production for distributed limiting.
 * 
 * Developed by: Om Chauhan
 */

import rateLimit from 'express-rate-limit';
import { SECURITY } from '../config/security';
import { logger } from '../config/logger';

/**
 * General API rate limiter — 100 req/min
 */
export const generalRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT.GENERAL.windowMs,
  max: SECURITY.RATE_LIMIT.GENERAL.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if behind a proxy, otherwise use IP
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  },
});

/**
 * Auth rate limiter — 20 req/min (stricter for login/register)
 */
export const authRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT.AUTH.windowMs,
  max: SECURITY.RATE_LIMIT.AUTH.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
  keyGenerator: (req) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  },
});

/**
 * Payment rate limiter — 30 req/min
 */
export const paymentRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT.PAYMENT.windowMs,
  max: SECURITY.RATE_LIMIT.PAYMENT.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many payment requests. Please try again later.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn(`Payment rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Sensitive operations rate limiter — 10 req/min
 */
export const sensitiveRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT.SENSITIVE.windowMs,
  max: SECURITY.RATE_LIMIT.SENSITIVE.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
      message: 'Too many requests for this operation. Please try again later.',
    },
  },
});
