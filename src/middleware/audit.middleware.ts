/**
 * Audit Logging Middleware
 * ================================================
 * Immutable audit trail for all sensitive operations.
 * Critical for financial compliance and security.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { securityLogger } from '../config/logger';
import { SECURITY } from '../config/security';

export interface AuditEntry {
  timestamp: string;
  requestId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode?: number;
  ip: string;
  userAgent: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Audit middleware — logs all API requests with security context
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = (req.headers[SECURITY.HEADERS.REQUEST_ID] as string) || 'unknown';

  // Capture response finish to log duration and status
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: Parameters<Response['end']>): Response {
    const duration = Date.now() - startTime;

    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      userId: (req as Request & { user?: { id: string } }).user?.id,
      action: `${req.method} ${req.path}`,
      resourceType: extractResourceType(req.path),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      duration,
    };

    // Log based on response status
    if (res.statusCode >= 500) {
      securityLogger.error('API Error', entry);
    } else if (res.statusCode >= 400) {
      securityLogger.warn('API Client Error', entry);
    } else {
      securityLogger.info('API Request', entry);
    }

    return originalEnd.apply(this, args);
  } as typeof res.end;

  next();
}

/**
 * Extract resource type from URL path for audit categorization
 */
function extractResourceType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  // e.g., /api/v1/auth/login → 'auth'
  // e.g., /api/v1/khata/balance → 'khata'
  return segments[2] || segments[1] || segments[0] || 'root';
}
