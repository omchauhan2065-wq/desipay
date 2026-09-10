/**
 * Custom Error Classes
 * ================================================
 * Structured error handling that NEVER leaks
 * internal details to the client.
 * 
 * Developed by: Om Chauhan
 */

import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST') {
    super(message, StatusCodes.BAD_REQUEST, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, StatusCodes.UNAUTHORIZED, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, StatusCodes.FORBIDDEN, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, StatusCodes.NOT_FOUND, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', code: string = 'CONFLICT') {
    super(message, StatusCodes.CONFLICT, code);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message: string = 'Validation failed') {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, StatusCodes.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }
}

export class PaymentError extends AppError {
  public readonly paymentId?: string;

  constructor(message: string, paymentId?: string) {
    super(message, StatusCodes.PAYMENT_REQUIRED, 'PAYMENT_ERROR');
    this.paymentId = paymentId;
  }
}

export class AccountLockedError extends AppError {
  public readonly lockExpiresAt: Date;

  constructor(lockExpiresAt: Date) {
    super(
      'Account is temporarily locked due to too many failed login attempts.',
      StatusCodes.FORBIDDEN,
      'ACCOUNT_LOCKED'
    );
    this.lockExpiresAt = lockExpiresAt;
  }
}
