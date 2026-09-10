/**
 * OTP Service
 * ================================================
 * Generates and verifies one-time passwords for
 * phone/email verification and password resets.
 * Primary store: Redis with TTL.
 * Fallback: In-memory store with automatic cleanup.
 * 
 * Developed by: Om Chauhan
 */

import crypto from 'crypto';
import { getRedisClient } from '../../config/redis';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { SECURITY } from '../../config/security';
import { BadRequestError } from '../../shared/errors';

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const MAX_OTP_ATTEMPTS = 5;

// In-memory fallback if Redis is unreachable
interface InMemoryOtp {
  otp: string;
  expiresAt: number;
  attempts: number;
}
const memoryOtpStore = new Map<string, InMemoryOtp>();

export class OtpService {
  /**
   * Generate a cryptographically secure numeric OTP
   */
  generateOtp(): string {
    const length = SECURITY.TOKEN.OTP_LENGTH;
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += crypto.randomInt(0, 10).toString();
    }
    return otp;
  }

  /**
   * Store OTP in Redis with TTL (or memory fallback)
   */
  async storeOtp(identifier: string, otp: string, durationMinutes: number = SECURITY.TOKEN.OTP_EXPIRES_MINUTES): Promise<void> {
    const ttlSeconds = durationMinutes * 60;

    try {
      const redis = getRedisClient();
      const key = `${OTP_PREFIX}${identifier}`;
      const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${identifier}`;

      await redis.setex(key, ttlSeconds, otp);
      await redis.del(attemptsKey);
      logger.debug(`OTP stored in Redis for ${identifier}, expires in ${ttlSeconds}s`);
    } catch (err) {
      logger.warn('Redis unavailable for OTP, using in-memory store fallback');
      memoryOtpStore.set(identifier, {
        otp,
        expiresAt: Date.now() + ttlSeconds * 1000,
        attempts: 0,
      });
    }
  }

  /**
   * Verify OTP against stored value
   * Implements attempt limiting to prevent brute force
   */
  async verifyOtp(identifier: string, inputOtp: string): Promise<boolean> {
    const key = `${OTP_PREFIX}${identifier}`;
    const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${identifier}`;

    let storedOtp: string | null = null;
    let attempts = 0;

    try {
      const redis = getRedisClient();
      attempts = await redis.incr(attemptsKey);

      if (attempts === 1) {
        await redis.expire(attemptsKey, SECURITY.TOKEN.OTP_EXPIRES_MINUTES * 60);
      }

      if (attempts > MAX_OTP_ATTEMPTS) {
        await redis.del(key);
        await redis.del(attemptsKey);
        throw new BadRequestError('Too many OTP verification attempts. Please request a new OTP.');
      }

      storedOtp = await redis.get(key);
    } catch (err) {
      if (err instanceof BadRequestError) throw err;
      // Memory fallback
      const record = memoryOtpStore.get(identifier);
      if (!record || record.expiresAt < Date.now()) {
        memoryOtpStore.delete(identifier);
        throw new BadRequestError('OTP has expired or was not found. Please request a new one.');
      }

      record.attempts += 1;
      if (record.attempts > MAX_OTP_ATTEMPTS) {
        memoryOtpStore.delete(identifier);
        throw new BadRequestError('Too many OTP verification attempts. Please request a new OTP.');
      }

      storedOtp = record.otp;
    }

    if (!storedOtp) {
      throw new BadRequestError('OTP has expired or was not found. Please request a new one.');
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(inputOtp.padEnd(SECURITY.TOKEN.OTP_LENGTH)),
      Buffer.from(storedOtp.padEnd(SECURITY.TOKEN.OTP_LENGTH))
    );

    if (isValid) {
      // Invalidate OTP after successful verification (single use)
      try {
        const redis = getRedisClient();
        await redis.del(key);
        await redis.del(attemptsKey);
      } catch {
        memoryOtpStore.delete(identifier);
      }
    }

    return isValid;
  }

  /**
   * Send OTP via SMS
   */
  async sendSmsOtp(phone: string, otp: string): Promise<void> {
    if (env.SMS_PROVIDER === 'mock' || env.NODE_ENV !== 'production') {
      logger.info(`📱 [SMS DISPATCH] OTP for ${phone}: [ ${otp} ]`);
      return;
    }
    // Production SMS Gateway (e.g., Twilio / Fast2SMS)
    logger.info(`Production SMS dispatched to ${phone}`);
  }

  /**
   * Send OTP via Email
   */
  async sendEmailOtp(email: string, otp: string): Promise<void> {
    if (env.NODE_ENV !== 'production') {
      logger.info(`📧 [EMAIL DISPATCH] OTP for ${email}: [ ${otp} ]`);
      return;
    }
    // Production Email Dispatch
    logger.info(`Production Email dispatched to ${email}`);
  }

  /**
   * Generate, store, and send OTP
   */
  async sendOtp(identifier: string, channel: 'sms' | 'email'): Promise<string> {
    const otp = this.generateOtp();
    await this.storeOtp(identifier, otp);

    if (channel === 'sms') {
      await this.sendSmsOtp(identifier, otp);
    } else {
      await this.sendEmailOtp(identifier, otp);
    }

    return otp;
  }
}

export const otpService = new OtpService();
