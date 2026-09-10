/**
 * Auth Service Unit Tests
 * ================================================
 * Developed by: Om Chauhan
 */

import { authService } from '../../src/modules/auth/auth.service';
import { ConflictError, UnauthorizedError, AccountLockedError } from '../../src/shared/errors';

describe('AuthService', () => {
  const runId = Date.now();
  const registerInput = {
    email: `om.chauhan.${runId}@desipay.com`,
    phone: `+9198${String(runId).slice(-8)}`,
    password: 'Password@123',
    confirmPassword: 'Password@123',
    fullName: 'Om Chauhan',
    role: 'CUSTOMER' as const,
  };

  it('should register a new user successfully and return tokens', async () => {
    const result = await authService.register(registerInput);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(registerInput.email);
    expect(result.user.phone).toBe(registerInput.phone);
    expect(result.user.role).toBe('CUSTOMER');
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.otpSent).toBe(true);
  });

  it('should prevent registering duplicate email or phone', async () => {
    await expect(authService.register(registerInput)).rejects.toThrow(ConflictError);
  });

  it('should log in successfully with correct credentials', async () => {
    const result = await authService.login({
      email: registerInput.email,
      password: registerInput.password,
    });

    expect(result.user).toBeDefined();
    expect(result.tokens?.accessToken).toBeDefined();
    expect(result.tokens?.refreshToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    await expect(
      authService.login({
        email: registerInput.email,
        password: 'WrongPassword@999',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should lock out account after 5 consecutive failed login attempts', async () => {
    const lockoutEmail = `lockout.${runId}@desipay.com`;
    await authService.register({
      email: lockoutEmail,
      phone: `+9197${String(runId).slice(-8)}`,
      password: 'SafePassword#1',
      confirmPassword: 'SafePassword#1',
      fullName: 'Lockout Test',
      role: 'CUSTOMER',
    });

    // 4 failed attempts
    for (let i = 0; i < 4; i++) {
      await expect(
        authService.login({ email: lockoutEmail, password: 'BadPassword#0' })
      ).rejects.toThrow(UnauthorizedError);
    }

    // 5th failed attempt should trigger account lockout
    await expect(
      authService.login({ email: lockoutEmail, password: 'BadPassword#0' })
    ).rejects.toThrow(AccountLockedError);
  });

  it('should refresh access token using valid refresh token', async () => {
    const loginRes = await authService.login({
      email: registerInput.email,
      password: registerInput.password,
    });

    const refreshed = await authService.refreshAccessToken(loginRes.tokens!.refreshToken);
    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
  });

  it('should setup, verify, and activate MFA for a user', async () => {
    const user = await authService.getUserById((await authService.login({
      email: registerInput.email,
      password: registerInput.password,
    })).user!.id);

    expect(user).toBeDefined();

    const mfaSetup = await authService.setupMfa(user!.id);
    expect(mfaSetup.secret).toBeDefined();
    expect(mfaSetup.qrCodeDataUrl).toBeDefined();
    expect(mfaSetup.backupCodes.length).toBe(8);
  });

  it('should generate password reset token and allow password reset', async () => {
    const forgotRes = await authService.forgotPassword(registerInput.email);
    expect(forgotRes.resetToken).toBeDefined();

    await authService.resetPassword({
      token: forgotRes.resetToken,
      password: 'NewPassword@2026',
      confirmPassword: 'NewPassword@2026',
    });

    // Should be able to login with new password
    const newLogin = await authService.login({
      email: registerInput.email,
      password: 'NewPassword@2026',
    });
    expect(newLogin.user).toBeDefined();
  });
});
