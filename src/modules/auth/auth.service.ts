/**
 * Auth Service
 * ================================================
 * Business logic for authentication, authorization,
 * MFA, session rotation, account lockout, and password management.
 * Primary storage: PostgreSQL via Prisma.
 * Resilient fallback: In-memory store for unit test/isolated environments.
 * 
 * Developed by: Om Chauhan
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();
import { env } from '../../config/env';
import { securityLogger, logger } from '../../config/logger';
import { SECURITY, UserRole, AuditAction } from '../../config/security';
import { prisma } from '../../config/prisma';
import {
  UnauthorizedError,
  ConflictError,
  AccountLockedError,
  BadRequestError,
  NotFoundError,
} from '../../shared/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from '../../middleware/auth.middleware';
import { otpService } from './otp.service';
import { mfaService, MfaSetupResult } from './mfa.service';
import { sessionService, SessionData } from './session.service';
import { auditService } from '../audit/audit.service';
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from './auth.schema';
import type { Role as PrismaRole } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  customerProfile?: unknown;
  shopkeeperProfile?: unknown;
  b2bProfile?: unknown;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  session?: SessionData;
}

export interface LoginResult {
  user?: SafeUser;
  tokens?: AuthTokens;
  mfaRequired?: boolean;
  tempToken?: string;
}

// In-memory fallback if database is not reachable during testing
const memoryUsers = new Map<string, any>();
const passwordResetTokens = new Map<string, { email: string; expiresAt: number }>();
const tempMfaTokens = new Map<string, { userId: string; expiresAt: number }>();
const pendingMfaSecrets = new Map<string, { secret: string; backupCodes: string[] }>();

export class AuthService {
  /**
   * Helper: sanitize user object
   */
  private sanitizeUser(user: any): SafeUser {
    const { passwordHash: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Register a new user
   */
  async register(
    input: RegisterInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: SafeUser; tokens: AuthTokens; otpSent: boolean }> {
    let existingUser = null;

    try {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: input.email }, { phone: input.phone }],
        },
      });
    } catch {
      // Fallback
      existingUser = Array.from(memoryUsers.values()).find(
        (u) => u.email === input.email || u.phone === input.phone
      );
    }

    if (existingUser) {
      throw new ConflictError('User with this email or phone already exists');
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
    const userId = uuidv4();
    const role = input.role as unknown as PrismaRole;

    let createdUser: any = null;

    try {
      createdUser = await prisma.user.create({
        data: {
          id: userId,
          email: input.email,
          phone: input.phone,
          passwordHash,
          fullName: input.fullName,
          role,
          isVerified: false,
          isActive: true,
          mfaEnabled: false,
          lastLoginIp: ipAddress,
          customerProfile:
            input.role === 'CUSTOMER'
              ? {
                  create: {
                    languagePref: 'hi',
                  },
                }
              : undefined,
          shopkeeperProfile:
            input.role === 'SHOPKEEPER'
              ? {
                  create: {
                    shopName: input.shopName || `${input.fullName}'s Shop`,
                    shopAddress: input.shopAddress || 'Not Provided',
                  },
                }
              : undefined,
          b2bProfile:
            input.role === 'B2B_CUSTOMER'
              ? {
                  create: {
                    businessName: input.businessName || `${input.fullName}'s Business`,
                    gstNumber: input.gstNumber || 'UNREGISTERED',
                  },
                }
              : undefined,
        },
        include: {
          customerProfile: true,
          shopkeeperProfile: true,
          b2bProfile: true,
        },
      });
    } catch (err) {
      logger.warn('Prisma create failed, storing in memory fallback', { err });
      createdUser = {
        id: userId,
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        isVerified: false,
        isActive: true,
        mfaEnabled: false,
        failedLoginAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryUsers.set(userId, createdUser);
    }

    // Send verification OTP automatically
    await otpService.sendOtp(input.phone, 'sms');

    // Create session & JWTs
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role as UserRole,
      sessionId,
    });
    const refreshToken = generateRefreshToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role as UserRole,
      sessionId,
    });

    const session = await sessionService.createSession(
      createdUser.id,
      refreshToken,
      userAgent || 'unknown',
      ipAddress || 'unknown'
    );

    // Audit logging
    await auditService.log({
      userId: createdUser.id,
      action: AuditAction.REGISTER,
      resourceType: 'USER',
      resourceId: createdUser.id,
      ipAddress,
      userAgent,
      metadata: { email: createdUser.email, role: createdUser.role },
    });

    return {
      user: this.sanitizeUser(createdUser),
      tokens: { accessToken, refreshToken, session },
      otpSent: true,
    };
  }

  /**
   * Login with email/phone + password
   */
  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    let user: any = null;

    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            input.email ? { email: input.email } : {},
            input.phone ? { phone: input.phone } : {},
          ],
        },
        include: {
          customerProfile: true,
          shopkeeperProfile: true,
          b2bProfile: true,
        },
      });
    } catch {
      // Memory fallback
      user = Array.from(memoryUsers.values()).find(
        (u) => (input.email && u.email === input.email) || (input.phone && u.phone === input.phone)
      );
    }

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check account lockout
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      securityLogger.warn('Login attempt on locked account', {
        action: AuditAction.LOGIN_FAILED,
        userId: user.id,
        reason: 'account_locked',
      });
      throw new AccountLockedError(new Date(user.lockUntil));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockUntil: Date | undefined = undefined;

      if (attempts >= SECURITY.LOCKOUT.MAX_FAILED_ATTEMPTS) {
        lockUntil = new Date(Date.now() + SECURITY.LOCKOUT.LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: attempts,
            lockUntil: lockUntil || undefined,
          },
        });
      } catch {
        user.failedLoginAttempts = attempts;
        user.lockUntil = lockUntil;
      }

      await auditService.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress,
        userAgent,
        metadata: { attempts, locked: !!lockUntil },
      });

      if (lockUntil) {
        throw new AccountLockedError(lockUntil);
      }

      throw new UnauthorizedError('Invalid credentials');
    }

    // Reset failed attempts upon success
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: ipAddress,
        },
      });
    } catch {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAt = new Date();
      user.lastLoginIp = ipAddress;
    }

    // If MFA is enabled, require 2nd step
    if (user.mfaEnabled) {
      const tempToken = uuidv4();
      tempMfaTokens.set(tempToken, {
        userId: user.id,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
      });

      return {
        mfaRequired: true,
        tempToken,
      };
    }

    // Issue tokens & session
    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId,
    });

    const session = await sessionService.createSession(
      user.id,
      refreshToken,
      userAgent || 'unknown',
      ipAddress || 'unknown'
    );

    await auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user: this.sanitizeUser(user),
      tokens: { accessToken, refreshToken, session },
    };
  }

  /**
   * Verify MFA during Login
   */
  async verifyMfaLogin(
    tempToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const record = tempMfaTokens.get(tempToken);
    if (!record || record.expiresAt < Date.now()) {
      tempMfaTokens.delete(tempToken);
      throw new UnauthorizedError('MFA session expired or invalid. Please log in again.');
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: record.userId },
        include: { customerProfile: true, shopkeeperProfile: true, b2bProfile: true },
      });
    } catch {
      user = memoryUsers.get(record.userId);
    }

    if (!user || !user.mfaSecret) {
      throw new UnauthorizedError('Invalid user MFA state');
    }

    const isValid = mfaService.verifyToken(user.mfaSecret, code);
    if (!isValid) {
      throw new UnauthorizedError('Invalid MFA code');
    }

    tempMfaTokens.delete(tempToken);

    const sessionId = uuidv4();
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      sessionId,
    });

    const session = await sessionService.createSession(
      user.id,
      refreshToken,
      userAgent || 'unknown',
      ipAddress || 'unknown'
    );

    await auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress,
      userAgent,
      metadata: { mfa: true },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: { accessToken, refreshToken, session },
    };
  }

  /**
   * Refresh access token with token rotation & theft detection
   */
  async refreshAccessToken(
    oldRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyToken(oldRefreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    const storedSession = await sessionService.getSessionByRefreshToken(oldRefreshToken);

    if (!storedSession) {
      // Possible token theft or replay!
      securityLogger.error('Refresh token reuse detected — nuclear session revocation triggered', {
        userId: payload.userId,
        sessionId: payload.sessionId,
      });

      await sessionService.destroyAllUserSessions(payload.userId);
      throw new UnauthorizedError('Session compromised. Please log in again.');
    }

    // Generate new token pair
    const sessionId = storedSession.sessionId;
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      sessionId,
    });
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      sessionId,
    });

    // Rotate refresh token
    await sessionService.rotateRefreshToken(sessionId, newRefreshToken);

    await auditService.log({
      userId: payload.userId,
      action: 'TOKEN_REFRESH',
      resourceType: 'SESSION',
      resourceId: sessionId,
      ipAddress,
      userAgent,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — invalidate single session
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await sessionService.getSessionByRefreshToken(refreshToken);
    if (session) {
      await sessionService.destroySession(session.sessionId);
    }
  }

  /**
   * Setup MFA (Generate Secret + QR Code)
   */
  async setupMfa(userId: string, passwordVerify?: string): Promise<MfaSetupResult & { backupCodes: string[] }> {
    const user = await this.getUserByIdWithSecret(userId);
    if (!user) throw new NotFoundError('User not found');

    if (passwordVerify) {
      const ok = await bcrypt.compare(passwordVerify, user.passwordHash);
      if (!ok) throw new UnauthorizedError('Invalid password verification');
    }

    const mfaSetup = await mfaService.setupMfa(userId, user.email);
    const backupCodes = mfaService.generateBackupCodes(8);

    pendingMfaSecrets.set(userId, {
      secret: mfaSetup.secret,
      backupCodes,
    });

    return {
      ...mfaSetup,
      backupCodes,
    };
  }

  /**
   * Verify & Activate MFA
   */
  async verifyAndActivateMfa(userId: string, code: string): Promise<{ backupCodes: string[] }> {
    const pending = pendingMfaSecrets.get(userId);
    if (!pending) {
      throw new BadRequestError('MFA setup not initiated. Please call setup first.');
    }

    const isValid = mfaService.verifyToken(pending.secret, code);
    if (!isValid) {
      throw new BadRequestError('Invalid verification code');
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaSecret: pending.secret,
        },
      });
    } catch {
      const u = memoryUsers.get(userId);
      if (u) {
        u.mfaEnabled = true;
        u.mfaSecret = pending.secret;
      }
    }

    pendingMfaSecrets.delete(userId);

    await auditService.log({
      userId,
      action: AuditAction.MFA_ENABLED,
      resourceType: 'USER',
      resourceId: userId,
    });

    return { backupCodes: pending.backupCodes };
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, passwordVerify: string, code: string): Promise<void> {
    const user = await this.getUserByIdWithSecret(userId);
    if (!user) throw new NotFoundError('User not found');

    const isPasswordValid = await bcrypt.compare(passwordVerify, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid password');

    if (user.mfaSecret) {
      const isCodeValid = mfaService.verifyToken(user.mfaSecret, code);
      if (!isCodeValid) throw new BadRequestError('Invalid MFA code');
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
        },
      });
    } catch {
      user.mfaEnabled = false;
      user.mfaSecret = null;
    }

    await auditService.log({
      userId,
      action: AuditAction.MFA_DISABLED,
      resourceType: 'USER',
      resourceId: userId,
    });
  }

  /**
   * Verify OTP for Phone/Email verification
   */
  async verifyOtp(identifier: string, otp: string, userId?: string): Promise<boolean> {
    const isValid = await otpService.verifyOtp(identifier, otp);
    if (!isValid) return false;

    if (userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: true },
        });
      } catch {
        const u = memoryUsers.get(userId);
        if (u) u.isVerified = true;
      }
    }

    return true;
  }

  /**
   * Request password reset token
   */
  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    let user: any = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch {
      user = Array.from(memoryUsers.values()).find((u) => u.email === email);
    }

    // Always return success outwardly to avoid user enumeration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SECURITY.TOKEN.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000;

    passwordResetTokens.set(resetToken, { email, expiresAt });

    if (user) {
      await otpService.sendEmailOtp(email, `Password reset token: ${resetToken}`);
      await auditService.log({
        userId: user.id,
        action: AuditAction.PASSWORD_RESET,
        resourceType: 'USER',
        resourceId: user.id,
      });
    }

    return { resetToken };
  }

  /**
   * Complete password reset
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const record = passwordResetTokens.get(input.token);
    if (!record || record.expiresAt < Date.now()) {
      passwordResetTokens.delete(input.token);
      throw new BadRequestError('Password reset token is invalid or has expired');
    }

    const newHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    let user: any = null;
    try {
      user = await prisma.user.findUnique({ where: { email: record.email } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: newHash,
            failedLoginAttempts: 0,
            lockUntil: null,
          },
        });
      }
    } catch {
      user = Array.from(memoryUsers.values()).find((u) => u.email === record.email);
      if (user) {
        user.passwordHash = newHash;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
      }
    }

    passwordResetTokens.delete(input.token);

    if (user) {
      // Invalidate all existing sessions for security
      await sessionService.destroyAllUserSessions(user.id);

      await auditService.log({
        userId: user.id,
        action: AuditAction.PASSWORD_CHANGE,
        resourceType: 'USER',
        resourceId: user.id,
      });
    }
  }

  /**
   * Get user by ID (safe)
   */
  async getUserById(userId: string): Promise<SafeUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customerProfile: true,
          shopkeeperProfile: true,
          b2bProfile: true,
        },
      });
      return user ? this.sanitizeUser(user) : null;
    } catch {
      const user = memoryUsers.get(userId);
      return user ? this.sanitizeUser(user) : null;
    }
  }

  /**
   * Helper: get raw user with secret
   */
  private async getUserByIdWithSecret(userId: string): Promise<any | null> {
    try {
      return await prisma.user.findUnique({ where: { id: userId } });
    } catch {
      return memoryUsers.get(userId) || null;
    }
  }
}

export const authService = new AuthService();
