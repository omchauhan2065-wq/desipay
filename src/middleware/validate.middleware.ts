/**
 * Request Validation Middleware
 * ================================================
 * Uses Zod schemas to validate request body, params,
 * and query. Blocks malformed requests early.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Validate request data against Zod schemas.
 * Returns a middleware function that validates and
 * replaces req.body/params/query with parsed data.
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params) as Record<string, any>;
        try {
          req.params = parsed;
        } catch {
          Object.defineProperty(req, 'params', { value: parsed, writable: true, configurable: true });
        }
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query) as Record<string, any>;
        try {
          req.query = parsed;
        } catch {
          Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};

        for (const issue of error.issues) {
          const path = issue.path.join('.') || 'general';
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }

        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: formattedErrors,
          },
        });
        return;
      }
      next(error);
    }
  };
}
