/**
 * Security Middleware
 * ================================================
 * Comprehensive HTTP security hardening layer using
 * Helmet, CORS, CSP, HPP, and other protections.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import { env } from '../config/env';
import { SECURITY } from '../config/security';

/**
 * Helmet — Sets various HTTP security headers
 */
export const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: SECURITY.CSP.DEFAULT_SRC,
      scriptSrc: SECURITY.CSP.SCRIPT_SRC,
      styleSrc: SECURITY.CSP.STYLE_SRC,
      imgSrc: SECURITY.CSP.IMG_SRC,
      fontSrc: SECURITY.CSP.FONT_SRC,
      connectSrc: SECURITY.CSP.CONNECT_SRC,
      frameAncestors: SECURITY.CSP.FRAME_ANCESTORS,
      baseUri: SECURITY.CSP.BASE_URI,
      formAction: SECURITY.CSP.FORM_ACTION,
    },
  },
  // Strict-Transport-Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // X-Frame-Options
  frameguard: { action: 'deny' },
  // X-Content-Type-Options
  noSniff: true,
  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: false },
  // X-Download-Options
  ieNoOpen: true,
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
});

/**
 * CORS — Only allow known origins
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

    // Allow requests with no origin (server-to-server, curl, etc.) in dev
    if (!origin && env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // Preflight cache: 24 hours
});

/**
 * HPP — HTTP Parameter Pollution protection
 */
export const hppMiddleware = hpp({
  whitelist: ['sort', 'filter', 'fields', 'page', 'limit'],
});

/**
 * Request ID — Attach unique ID to every request for tracing
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.headers[SECURITY.HEADERS.REQUEST_ID] =
    req.headers[SECURITY.HEADERS.REQUEST_ID] || crypto.randomUUID();
  next();
}

/**
 * No Cache for API responses — prevent caching of sensitive data
 */
export function noCacheMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}

/**
 * Sanitize response — remove fingerprinting headers
 */
export function removeFingerprint(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
}
