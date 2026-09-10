/**
 * RBAC (Role-Based Access Control) Middleware
 * ================================================
 * Enforces role-based permissions. Shopkeepers can't
 * access B2B routes, customers can't access admin, etc.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/errors';
import { UserRole } from '../config/security';

/**
 * Authorize — Check if authenticated user has required role(s)
 * Must be used AFTER authenticate middleware
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        )
      );
    }

    next();
  };
}

/**
 * Authorize self or admin — User can only access their own resources,
 * unless they're an admin
 */
export function authorizeSelfOrAdmin(userIdParam: string = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const targetUserId = req.params[userIdParam];
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
    const isSelf = req.user.userId === targetUserId;

    if (!isAdmin && !isSelf) {
      return next(new ForbiddenError('You can only access your own resources'));
    }

    next();
  };
}

/**
 * Role hierarchy check — higher roles can do what lower roles can
 */
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.B2B_CUSTOMER]: 2,
  [UserRole.SHOPKEEPER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.SUPER_ADMIN]: 5,
};

/**
 * Authorize minimum role — user must have at least this role level
 */
export function authorizeMinRole(minRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userLevel = roleHierarchy[req.user.role as UserRole] || 0;
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
