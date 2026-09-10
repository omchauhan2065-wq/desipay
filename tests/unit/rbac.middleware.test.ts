/**
 * RBAC Middleware Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { authorize, authorizeSelfOrAdmin, authorizeMinRole } from '../../src/middleware/rbac.middleware';
import { UserRole } from '../../src/config/security';
import { ForbiddenError, UnauthorizedError } from '../../src/shared/errors';
import { Request, Response, NextFunction } from 'express';

describe('RBAC Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('authorize', () => {
    it('should allow access if user has one of the allowed roles', () => {
      mockReq.user = {
        userId: 'u-1',
        email: 'admin@desipay.com',
        role: UserRole.ADMIN,
        sessionId: 's-1',
        type: 'access',
      };

      const middleware = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject access if user lacks the required role', () => {
      mockReq.user = {
        userId: 'u-2',
        email: 'customer@desipay.com',
        role: UserRole.CUSTOMER,
        sessionId: 's-2',
        type: 'access',
      };

      const middleware = authorize(UserRole.ADMIN);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject access if user is not authenticated', () => {
      mockReq.user = undefined;

      const middleware = authorize(UserRole.CUSTOMER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('authorizeMinRole', () => {
    it('should allow if role hierarchy is satisfied', () => {
      mockReq.user = {
        userId: 'u-3',
        email: 'shop@desipay.com',
        role: UserRole.SHOPKEEPER,
        sessionId: 's-3',
        type: 'access',
      };

      // SHOPKEEPER (level 3) >= CUSTOMER (level 1)
      const middleware = authorizeMinRole(UserRole.CUSTOMER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny if role hierarchy is not satisfied', () => {
      mockReq.user = {
        userId: 'u-4',
        email: 'customer@desipay.com',
        role: UserRole.CUSTOMER,
        sessionId: 's-4',
        type: 'access',
      };

      // CUSTOMER (level 1) < SHOPKEEPER (level 3)
      const middleware = authorizeMinRole(UserRole.SHOPKEEPER);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('authorizeSelfOrAdmin', () => {
    it('should allow user accessing their own resource', () => {
      mockReq.user = {
        userId: 'target-user-id',
        email: 'user@desipay.com',
        role: UserRole.CUSTOMER,
        sessionId: 's-6',
        type: 'access',
      };
      mockReq.params = { userId: 'target-user-id' };

      const middleware = authorizeSelfOrAdmin('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow admin accessing another user resource', () => {
      mockReq.user = {
        userId: 'admin-id',
        email: 'admin@desipay.com',
        role: UserRole.ADMIN,
        sessionId: 's-7',
        type: 'access',
      };
      mockReq.params = { userId: 'different-user-id' };

      const middleware = authorizeSelfOrAdmin('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny customer accessing another user resource', () => {
      mockReq.user = {
        userId: 'customer-1',
        email: 'c1@desipay.com',
        role: UserRole.CUSTOMER,
        sessionId: 's-8',
        type: 'access',
      };
      mockReq.params = { userId: 'customer-2' };

      const middleware = authorizeSelfOrAdmin('userId');
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});
