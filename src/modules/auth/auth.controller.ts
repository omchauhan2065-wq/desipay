/**
 * Auth Controller
 * ================================================
 * Thin HTTP layer for authentication operations.
 * Sets secure HttpOnly cookies and routes business
 * logic to AuthService, SessionService, and OtpService.
 * 
 * Developed by: Om Chauhan
 */

import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from './auth.service';
import { sessionService } from './session.service';
import { otpService } from './otp.service';
import { setAuthCookies, clearAuthCookies } from '../../middleware/auth.middleware';
import type {
  RegisterInput,
  LoginInput,
  VerifyOtpInput,
  SendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  MfaSetupInput,
  MfaVerifyInput,
  MfaLoginVerifyInput,
  MfaDisableInput,
} from './auth.schema';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: RegisterInput = req.body;
      const result = await authService.register(
        input,
        req.ip,
        req.headers['user-agent']
      );

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Registration successful. Verification OTP has been sent.',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          otpSent: result.otpSent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(
        input,
        req.ip,
        req.headers['user-agent']
      );

      if (result.mfaRequired) {
        res.status(StatusCodes.OK).json({
          success: true,
          message: 'MFA verification required to complete login',
          data: {
            mfaRequired: true,
            tempToken: result.tempToken,
          },
        });
        return;
      }

      if (result.tokens && result.user) {
        setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

        res.status(StatusCodes.OK).json({
          success: true,
          message: 'Login successful',
          data: {
            user: result.user,
            accessToken: result.tokens.accessToken,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/mfa/verify-login
   */
  async mfaLoginVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: MfaLoginVerifyInput = req.body;
      const result = await authService.verifyMfaLogin(
        input.tempToken,
        input.code,
        req.ip,
        req.headers['user-agent']
      );

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA verified and login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/mfa/setup
   */
  async mfaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input: MfaSetupInput = req.body;
      const result = await authService.setupMfa(userId, input.password);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA setup initiated. Scan QR code and verify to activate.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/mfa/verify
   */
  async mfaVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input: MfaVerifyInput = req.body;
      const result = await authService.verifyAndActivateMfa(userId, input.code);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA successfully enabled on account',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/mfa/disable
   */
  async mfaDisable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const input: MfaDisableInput = req.body;
      await authService.disableMfa(userId, input.password, input.code);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA successfully disabled',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/send-otp
   */
  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: SendOtpInput = req.body;
      await otpService.sendOtp(input.identifier, input.channel);

      res.status(StatusCodes.OK).json({
        success: true,
        message: `OTP dispatched to ${input.identifier}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-otp
   */
  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: VerifyOtpInput = req.body;
      const userId = req.user?.userId;
      const isValid = await authService.verifyOtp(input.identifier, input.otp, userId);

      if (!isValid) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'The OTP entered is invalid or expired' },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'OTP verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: ForgotPasswordInput = req.body;
      const result = await authService.forgotPassword(input.email);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been dispatched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: ResetPasswordInput = req.body;
      await authService.resetPassword(input);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password has been successfully reset. Please log in with your new password.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'Refresh token not provided',
          },
        });
        return;
      }

      const result = await authService.refreshAccessToken(
        refreshToken,
        req.ip,
        req.headers['user-agent']
      );

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      clearAuthCookies(res);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        });
        return;
      }

      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/sessions
   */
  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const sessions = await sessionService.getUserSessions(userId);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/auth/sessions/:id
   */
  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.id as string;
      await sessionService.destroySession(sessionId);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/auth/sessions
   */
  async revokeAllSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      await sessionService.destroyAllUserSessions(userId);
      clearAuthCookies(res);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'All active sessions have been terminated',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
