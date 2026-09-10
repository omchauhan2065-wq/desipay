/**
 * Global Error Handler Middleware
 * ================================================
 * Catches all errors, logs them securely, and returns
 * sanitized responses. NEVER leaks stack traces or
 * internal details to the client.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError, ValidationError } from '../shared/errors';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { SECURITY } from '../config/security';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId?: string;
  };
}

/**
 * Global error handler — the last middleware in the chain
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers[SECURITY.HEADERS.REQUEST_ID] as string;

  // Default error values
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred. Please try again later.';
  let details: Record<string, string[]> | undefined;

  // Handle known operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;

    if (err instanceof ValidationError) {
      details = err.errors;
    }

    // Log operational errors at warn level
    logger.warn('Operational error', {
      code,
      message,
      statusCode,
      path: req.path,
      method: req.method,
      requestId,
    });
  } else {
    // Unknown/programming errors — log full details but return generic message
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      requestId,
    });
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      requestId,
    },
  };

  // Include validation details if available
  if (details) {
    response.error.details = details;
  }

  // Only include stack trace in development for debugging
  if (env.NODE_ENV === 'development' && !(err instanceof AppError && err.isOperational)) {
    (response as unknown as Record<string, unknown>).stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 handler — catch all unmatched routes
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    StatusCodes.NOT_FOUND,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}
