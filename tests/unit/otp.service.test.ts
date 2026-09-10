/**
 * OTP Service Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { otpService } from '../../src/modules/auth/otp.service';
import { SECURITY } from '../../src/config/security';

describe('OtpService', () => {
  const testPhone = '+919876543210';
  const testEmail = 'test@example.com';

  it('should generate a 6-digit numeric OTP', () => {
    const otp = otpService.generateOtp();
    expect(otp).toBeDefined();
    expect(otp.length).toBe(SECURITY.TOKEN.OTP_LENGTH);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should store and successfully verify a valid OTP', async () => {
    const otp = '123456';
    await otpService.storeOtp(testPhone, otp);

    const isValid = await otpService.verifyOtp(testPhone, otp);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect OTP', async () => {
    const otp = '654321';
    await otpService.storeOtp(testPhone, otp);

    const isValid = await otpService.verifyOtp(testPhone, '000000');
    expect(isValid).toBe(false);
  });

  it('should reject verification after OTP is already consumed (single-use)', async () => {
    const otp = '789012';
    await otpService.storeOtp(testPhone, otp);

    const firstTry = await otpService.verifyOtp(testPhone, otp);
    expect(firstTry).toBe(true);

    // Second attempt should fail as OTP was deleted
    await expect(otpService.verifyOtp(testPhone, otp)).rejects.toThrow(
      /OTP has expired or was not found/
    );
  });

  it('should lock out after maximum failed attempts', async () => {
    const phone = '+919876543219';
    await otpService.storeOtp(phone, '999999');

    // Make 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      const ok = await otpService.verifyOtp(phone, '111111');
      expect(ok).toBe(false);
    }

    // 6th attempt should throw too many attempts error
    await expect(otpService.verifyOtp(phone, '111111')).rejects.toThrow(
      /Too many OTP verification attempts/
    );
  });

  it('should send OTP without throwing error', async () => {
    const generated = await otpService.sendOtp(testEmail, 'email');
    expect(generated).toBeDefined();
    expect(generated.length).toBe(6);
  });
});
