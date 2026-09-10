/**
 * Security Constants
 * ================================================
 * Centralized security configuration. All security-related
 * constants are defined here to avoid magic numbers/strings.
 * 
 * Developed by: Om Chauhan
 */

export const SECURITY = {
  // Password policy
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },

  // Account lockout
  LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 15,
    PROGRESSIVE_DELAY: true, // Increase delay with each failed attempt
  },

  // Session
  SESSION: {
    MAX_CONCURRENT_SESSIONS: 5,
    IDLE_TIMEOUT_MINUTES: 30,
  },

  // Rate limiting tiers
  RATE_LIMIT: {
    GENERAL: { windowMs: 60_000, max: 100 },
    AUTH: { windowMs: 60_000, max: 20 },
    PAYMENT: { windowMs: 60_000, max: 30 },
    SENSITIVE: { windowMs: 60_000, max: 10 },
  },

  // Token
  TOKEN: {
    ACCESS_TOKEN_TYPE: 'access',
    REFRESH_TOKEN_TYPE: 'refresh',
    RESET_TOKEN_EXPIRES_MINUTES: 30,
    VERIFY_TOKEN_EXPIRES_HOURS: 24,
    OTP_EXPIRES_MINUTES: 5,
    OTP_LENGTH: 6,
  },

  // Headers
  HEADERS: {
    REQUEST_ID: 'x-request-id',
    RATE_LIMIT_REMAINING: 'x-ratelimit-remaining',
    RATE_LIMIT_RESET: 'x-ratelimit-reset',
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'"],
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    IMG_SRC: ["'self'", 'data:', 'https:'],
    FONT_SRC: ["'self'", 'https://fonts.gstatic.com'],
    CONNECT_SRC: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
  },

  // Request limits
  REQUEST: {
    MAX_BODY_SIZE: '1mb',
    MAX_URL_LENGTH: 2048,
    MAX_HEADER_SIZE: 8192,
  },

  // Audit
  AUDIT: {
    RETENTION_DAYS: 365, // Keep audit logs for 1 year
    FINANCIAL_RETENTION_DAYS: 2555, // 7 years for financial records
  },
} as const;

// User roles
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SHOPKEEPER = 'SHOPKEEPER',
  B2B_CUSTOMER = 'B2B_CUSTOMER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// Transaction types
export enum TransactionType {
  NAGDI = 'NAGDI',       // Cash payment
  UDHAR = 'UDHAR',       // Credit given
  REPAYMENT = 'REPAYMENT', // Credit repaid
  REFUND = 'REFUND',
  PURCHASE = 'PURCHASE',  // B2B purchase
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// Audit action types
export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  UDHAR_CREATED = 'UDHAR_CREATED',
  UDHAR_SETTLED = 'UDHAR_SETTLED',
  STOCK_UPDATED = 'STOCK_UPDATED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
}
