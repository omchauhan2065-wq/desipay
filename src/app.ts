/**
 * Express Application Setup
 * ================================================
 * Core Express app with all security middleware
 * configured in the correct order.
 * 
 * Developed by: Om Chauhan
 * Mentored by: Antigravity AI
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './config/env';
import { logger } from './config/logger';

// Security middleware
import {
  helmetMiddleware,
  corsMiddleware,
  hppMiddleware,
  requestIdMiddleware,
  noCacheMiddleware,
  removeFingerprint,
} from './middleware/security.middleware';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { auditMiddleware } from './middleware/audit.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.middleware';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import paymentRoutes from './modules/payment/payment.routes';
import khataRoutes from './modules/khata/khata.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import notificationRoutes from './modules/notification/notification.routes';
import deliveryRoutes from './modules/delivery/delivery.routes';
import voiceRoutes from './modules/voice/voice.routes';

const app = express();

// ============================================
// 1. Security Middleware (order matters!)
// ============================================

// Request ID for tracing
app.use(requestIdMiddleware);

// Remove fingerprinting headers
app.use(removeFingerprint);

// Helmet — HTTP security headers + CSP
app.use(helmetMiddleware);

// CORS — whitelist known origins
app.use(corsMiddleware);

// HPP — HTTP Parameter Pollution protection
app.use(hppMiddleware);

// Rate limiting
app.use(generalRateLimiter);

// ============================================
// 2. Parsing & Compression
// ============================================

// Body parser with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parser
app.use(cookieParser());

// Gzip compression
app.use(compression());

// ============================================
// 3. Logging & Audit
// ============================================

// HTTP request logging (Morgan → Winston)
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
    skip: (req) => req.url === '/health' || req.url === '/ready',
  })
);

// Security audit trail
app.use(auditMiddleware);

// No cache for API responses
app.use('/api', noCacheMiddleware);

// ============================================
// 4. API Documentation (Swagger)
// ============================================

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DesiPay API',
      version: '1.0.0',
      description: 'Cyber-secure Payment Gateway & Digital Khata Platform API',
      contact: {
        name: 'Om Chauhan',
        email: 'om@desipay.in',
      },
    },
    servers: [
      {
        url: `${env.APP_URL}/api/${env.API_VERSION}`,
        description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
    },
    security: [
      { bearerAuth: [] },
      { cookieAuth: [] },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.schema.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DesiPay API Docs',
  }));
}

// ============================================
// 5. Health & Readiness Checks
// ============================================

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: env.APP_NAME,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.get('/ready', async (_req, res) => {
  const checks: Record<string, string> = {};

  // PostgreSQL check
  try {
    const { prisma: prismaClient } = await import('./config/prisma');
    await prismaClient.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check
  try {
    const { getRedisClient } = await import('./config/redis');
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      checks.redis = 'ok';
    } else {
      checks.redis = 'unavailable';
    }
  } catch {
    checks.redis = 'error';
  }

  // MongoDB check
  try {
    const mongoose = await import('mongoose');
    checks.mongodb = mongoose.default.connection.readyState === 1 ? 'ok' : 'disconnected';
  } catch {
    checks.mongodb = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');
  const statusCode = allOk ? 200 : 503;

  res.status(statusCode).json({
    success: allOk,
    data: {
      status: allOk ? 'ready' : 'degraded',
      checks,
    },
  });
});

// ============================================
// 6. API Routes
// ============================================

const apiPrefix = `/api/${env.API_VERSION}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/payments`, paymentRoutes);
app.use(`${apiPrefix}/khata`, khataRoutes);
app.use(`${apiPrefix}/inventory`, inventoryRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/orders`, deliveryRoutes);
app.use(`${apiPrefix}/delivery`, deliveryRoutes);
app.use(`${apiPrefix}/voice`, voiceRoutes);
app.use(`${apiPrefix}/soundbox`, voiceRoutes);

// API status endpoint — list all registered modules
app.get(`${apiPrefix}/status`, (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      service: env.APP_NAME,
      version: '0.2.0',
      modules: [
        { name: 'auth', path: `${apiPrefix}/auth`, status: 'active' },
        { name: 'users', path: `${apiPrefix}/users`, status: 'active' },
        { name: 'payments', path: `${apiPrefix}/payments`, status: 'active' },
        { name: 'khata', path: `${apiPrefix}/khata`, status: 'active' },
        { name: 'inventory', path: `${apiPrefix}/inventory`, status: 'active' },
        { name: 'notifications', path: `${apiPrefix}/notifications`, status: 'active' },
        { name: 'voice', path: `${apiPrefix}/voice`, status: 'active' },
        { name: 'soundbox', path: `${apiPrefix}/soundbox`, status: 'active' },
        { name: 'delivery', path: `${apiPrefix}/delivery`, status: 'active' },
        { name: 'orders', path: `${apiPrefix}/orders`, status: 'active' },
        { name: 'b2b', path: `${apiPrefix}/b2b`, status: 'planned' },
      ],
      healthEndpoints: ['/health', '/ready'],
    },
  });
});

// ============================================
// 7. Error Handling (must be last)
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
