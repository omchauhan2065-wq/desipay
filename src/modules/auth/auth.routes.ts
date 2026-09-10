/**
 * Auth Routes
 * ================================================
 * Authentication endpoints with rate limiting,
 * Zod validation, and JWT security applied.
 * 
 * Developed by: Om Chauhan
 */

import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  authRateLimiter,
  sensitiveRateLimiter,
} from '../../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaSetupSchema,
  mfaVerifySchema,
  mfaLoginVerifySchema,
  mfaDisableSchema,
} from './auth.schema';

const router = Router();

// Registration & Login
router.post(
  '/register',
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login.bind(authController)
);

// MFA Endpoints
router.post(
  '/mfa/verify-login',
  authRateLimiter,
  validate({ body: mfaLoginVerifySchema }),
  authController.mfaLoginVerify.bind(authController)
);

router.post(
  '/mfa/setup',
  authenticate,
  sensitiveRateLimiter,
  validate({ body: mfaSetupSchema }),
  authController.mfaSetup.bind(authController)
);

router.post(
  '/mfa/verify',
  authenticate,
  authRateLimiter,
  validate({ body: mfaVerifySchema }),
  authController.mfaVerify.bind(authController)
);

router.post(
  '/mfa/disable',
  authenticate,
  sensitiveRateLimiter,
  validate({ body: mfaDisableSchema }),
  authController.mfaDisable.bind(authController)
);

// OTP Endpoints
router.post(
  '/send-otp',
  authRateLimiter,
  validate({ body: sendOtpSchema }),
  authController.sendOtp.bind(authController)
);

router.post(
  '/verify-otp',
  authRateLimiter,
  validate({ body: verifyOtpSchema }),
  authController.verifyOtp.bind(authController)
);

// Password Recovery
router.post(
  '/forgot-password',
  sensitiveRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword.bind(authController)
);

router.post(
  '/reset-password',
  sensitiveRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword.bind(authController)
);

// Token Refresh & Logout
router.post(
  '/refresh',
  authRateLimiter,
  authController.refresh.bind(authController)
);

router.post(
  '/logout',
  authController.logout.bind(authController)
);

// Authenticated User & Session Info
router.get(
  '/me',
  authenticate,
  authController.me.bind(authController)
);

router.get(
  '/sessions',
  authenticate,
  authController.getSessions.bind(authController)
);

router.delete(
  '/sessions/:id',
  authenticate,
  authController.revokeSession.bind(authController)
);

router.delete(
  '/sessions',
  authenticate,
  authController.revokeAllSessions.bind(authController)
);

export default router;
