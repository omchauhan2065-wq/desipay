/**
 * Winston Logger Configuration
 * ================================================
 * Structured JSON logging with rotation, separate
 * error log, and no sensitive data leakage.
 * 
 * Developed by: Om Chauhan
 */

import winston from 'winston';
import path from 'path';
import { env } from './env';

// Custom format to redact sensitive fields
const redactSensitive = winston.format((info) => {
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie', 'creditCard', 'pan', 'aadhaar'];
  
  if (typeof info.message === 'object') {
    const sanitized = { ...info.message as Record<string, unknown> };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    info.message = sanitized;
  }
  
  return info;
});

// Define log format
const logFormat = winston.format.combine(
  redactSensitive(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  redactSensitive(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${typeof message === 'object' ? JSON.stringify(message) : message} ${metaStr}`;
  })
);

const logDir = path.resolve(process.cwd(), env.LOG_DIR);

const transports: winston.transport[] = [
  // Console transport (always active)
  new winston.transports.Console({
    format: env.NODE_ENV === 'development' ? consoleFormat : logFormat,
    level: env.LOG_LEVEL,
  }),
];

// File transports (non-test environments)
if (env.NODE_ENV !== 'test') {
  transports.push(
    // All logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
      level: env.LOG_LEVEL,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // Error logs only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
    // Security audit logs
    new winston.transports.File({
      filename: path.join(logDir, 'security.log'),
      format: logFormat,
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30, // Keep 30 days of security logs
    })
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: env.APP_NAME,
    environment: env.NODE_ENV,
  },
  transports,
  // Don't exit on uncaught exceptions — let the process handler deal with it
  exitOnError: false,
});

// Create a security-specific logger
export const securityLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: `${env.APP_NAME}-security`,
    environment: env.NODE_ENV,
  },
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(env.NODE_ENV !== 'test'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'security.log'),
            format: logFormat,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 30,
          }),
        ]
      : []),
  ],
});

export default logger;
