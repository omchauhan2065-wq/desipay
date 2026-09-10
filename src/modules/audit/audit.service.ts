/**
 * Audit Log Service
 * ================================================
 * Immutable audit logging for security compliance,
 * financial traceability, and threat analysis.
 * 
 * Developed by: Om Chauhan
 */

import { prisma } from '../../config/prisma';
import { securityLogger, logger } from '../../config/logger';

export interface AuditLogData {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Record an immutable audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    // 1. Log to structured security logger
    securityLogger.info(`[AUDIT] ${data.action} on ${data.resourceType}`, {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // 2. Persist to PostgreSQL database (Prisma)
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId || null,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          metadata: (data.metadata as object) || undefined,
        },
      });
    } catch (error) {
      // Don't throw to avoid disrupting user transactions, but log with high alert
      logger.error('CRITICAL: Failed to persist audit log entry to database', {
        error,
        auditData: data,
      });
    }
  }

  /**
   * Retrieve audit logs with pagination and filters (Admin only)
   */
  async getLogs(params: {
    userId?: string;
    action?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.resourceType) where.resourceType = params.resourceType;

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching audit logs', { error });
      return { logs: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
    }
  }
}

export const auditService = new AuditService();
