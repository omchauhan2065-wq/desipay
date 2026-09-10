/**
 * JWT Authentication Middleware
 * ================================================
 * RS256 asymmetric JWT verification. Uses private key
 * for signing, public key for verification. Tokens
 * stored in HttpOnly secure cookies.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { UnauthorizedError } from '../shared/errors';
import { logger } from '../config/logger';
import { UserRole, SECURITY } from '../config/security';

// Token payload interface
export interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
  sessionId: string;
}

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Load RSA keys for JWT signing/verification
 * Keys are loaded once at startup and cached
 */
let privateKey: string | null = null;
let publicKey: string | null = null;

function getPrivateKey(): string {
  if (!privateKey) {
    if (env.JWT_PRIVATE_KEY_BASE64) {
      privateKey = Buffer.from(env.JWT_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
      return privateKey;
    }
    const keyPath = path.resolve(process.cwd(), env.JWT_PRIVATE_KEY_PATH);
    try {
      privateKey = fs.readFileSync(keyPath, 'utf8');
    } catch {
      logger.error(`Failed to load JWT private key from ${keyPath}`);
      throw new Error('JWT private key not found. Run: openssl genrsa -out keys/private.pem 4096');
    }
  }
  return privateKey;
}

function getPublicKey(): string {
  if (!publicKey) {
    if (env.JWT_PUBLIC_KEY_BASE64) {
      publicKey = Buffer.from(env.JWT_PUBLIC_KEY_BASE64, 'base64').toString('utf8');
      return publicKey;
    }
    const keyPath = path.resolve(process.cwd(), env.JWT_PUBLIC_KEY_PATH);
    try {
      publicKey = fs.readFileSync(keyPath, 'utf8');
    } catch {
      logger.error(`Failed to load JWT public key from ${keyPath}`);
      throw new Error('JWT public key not found. Run: openssl rsa -in keys/private.pem -pubout -out keys/public.pem');
    }
  }
  return publicKey;
}

/**
 * Generate an access token (short-lived, 15 min)
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  const options: jwt.SignOptions = {
    algorithm: 'RS256' as jwt.Algorithm,
    expiresIn: 15 * 60, // 15 minutes in seconds
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  };
  return jwt.sign(
    { ...payload, type: SECURITY.TOKEN.ACCESS_TOKEN_TYPE },
    getPrivateKey(),
    options
  );
}

/**
 * Generate a refresh token (long-lived, 7 days)
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string {
  const options: jwt.SignOptions = {
    algorithm: 'RS256' as jwt.Algorithm,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  };
  return jwt.sign(
    { ...payload, type: SECURITY.TOKEN.REFRESH_TOKEN_TYPE },
    getPrivateKey(),
    options
  );
}

/**
 * Verify a JWT token
 * CRITICAL: Always specify the algorithm to prevent algorithm confusion attacks
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getPublicKey(), {
      algorithms: ['RS256'], // NEVER trust the alg header
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
}

/**
 * Set auth cookies (HttpOnly, Secure, SameSite)
 */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = env.NODE_ENV === 'production';

  // Access token cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,       // Prevents XSS access
    secure: isProduction, // HTTPS only in production
    sameSite: 'strict',   // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  // Refresh token cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh', // Only sent to refresh endpoint
  });
}

/**
 * Clear auth cookies on logout
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
}

/**
 * Authentication middleware — verifies JWT from cookie or Authorization header
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Try cookie first (more secure), then Authorization header
    let token = req.cookies?.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please log in.');
    }

    // Verify and decode token
    const payload = verifyToken(token);

    // Ensure it's an access token, not a refresh token
    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Attach user to request
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication — doesn't fail if no token present
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = verifyToken(token);
      if (payload.type === 'access') {
        req.user = payload;
      }
    }
  } catch {
    // Silently ignore auth errors for optional auth
  }
  next();
}
