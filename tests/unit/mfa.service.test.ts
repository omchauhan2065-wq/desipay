/**
 * MFA Service Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { mfaService } from '../../src/modules/auth/mfa.service';
import speakeasy from 'speakeasy';

describe('MfaService', () => {
  const userId = 'user-test-123';
  const email = 'mfa-test@desipay.com';

  it('should generate MFA secret and QR code data URL', async () => {
    const result = await mfaService.setupMfa(userId, email);

    expect(result.secret).toBeDefined();
    expect(result.otpauthUrl).toContain('otpauth://totp/');
    expect(result.otpauthUrl).toContain(encodeURIComponent(email));
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should verify valid TOTP token against secret', async () => {
    const result = await mfaService.setupMfa(userId, email);
    const token = speakeasy.totp({
      secret: result.secret,
      encoding: 'base32',
    });

    const isValid = mfaService.verifyToken(result.secret, token);
    expect(isValid).toBe(true);
  });

  it('should reject invalid TOTP token', async () => {
    const result = await mfaService.setupMfa(userId, email);
    const isValid = mfaService.verifyToken(result.secret, '000000');
    expect(isValid).toBe(false);
  });

  it('should generate 10 unique backup recovery codes', () => {
    const codes = mfaService.generateBackupCodes(10);
    expect(codes.length).toBe(10);
    expect(new Set(codes).size).toBe(10);
    // Check format XXXX-XXXX
    expect(/^\w{4}-\w{4}$/.test(codes[0])).toBe(true);
  });

  it('should verify and consume a backup code', () => {
    const codes = mfaService.generateBackupCodes(3);
    const codeToUse = codes[1];

    const result = mfaService.verifyBackupCode(codeToUse, codes);
    expect(result.valid).toBe(true);
    expect(result.remainingCodes.length).toBe(2);
    expect(result.remainingCodes.includes(codeToUse)).toBe(false);
  });

  it('should fail verification if backup code does not exist', () => {
    const codes = mfaService.generateBackupCodes(3);
    const result = mfaService.verifyBackupCode('INVALID-CODE', codes);
    expect(result.valid).toBe(false);
    expect(result.remainingCodes.length).toBe(3);
  });
});
