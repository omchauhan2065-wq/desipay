/**
 * MFA (Multi-Factor Authentication) Service
 * ================================================
 * TOTP-based MFA using Google Authenticator compatible
 * codes. Generates secrets, QR codes, and verifies tokens.
 * 
 * Developed by: Om Chauhan
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface MfaSetupResult {
  secret: string;        // Base32 encoded secret (store encrypted in DB)
  otpauthUrl: string;    // URL for QR code
  qrCodeDataUrl: string; // Base64 QR code image
}

export class MfaService {
  /**
   * Generate a new TOTP secret for a user
   */
  async setupMfa(userId: string, email: string): Promise<MfaSetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${env.MFA_APP_NAME} (${email})`,
      issuer: env.MFA_ISSUER,
      length: 32,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new Error('Failed to generate MFA secret');
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    logger.info('MFA setup initiated', { userId });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrCodeDataUrl,
    };
  }

  /**
   * Verify a TOTP code against the user's secret
   * Uses a window of 1 (30 seconds before/after) for clock drift
   */
  verifyToken(secret: string, token: string): boolean {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after for clock drift
    });

    return isValid;
  }

  /**
   * Generate backup codes for account recovery
   * Each code is a random 8-character alphanumeric string
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
      }
      // Format as XXXX-XXXX for readability
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Verify a backup code (one-time use)
   */
  verifyBackupCode(inputCode: string, storedCodes: string[]): { valid: boolean; remainingCodes: string[] } {
    const normalizedInput = inputCode.replace('-', '').toUpperCase();
    const index = storedCodes.findIndex(
      (code) => code.replace('-', '').toUpperCase() === normalizedInput
    );

    if (index === -1) {
      return { valid: false, remainingCodes: storedCodes };
    }

    // Remove used code
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);

    return { valid: true, remainingCodes };
  }
}

export const mfaService = new MfaService();
