/**
 * Auth Validation Schemas (Zod)
 * ================================================
 * All auth request bodies are validated against these
 * schemas before reaching the controller.
 * 
 * Developed by: Om Chauhan
 */

import { z } from 'zod';
import { SECURITY } from '../../config/security';

/**
 * Password validation with security requirements
 */
export const passwordSchema = z
  .string()
  .min(SECURITY.PASSWORD.MIN_LENGTH, `Password must be at least ${SECURITY.PASSWORD.MIN_LENGTH} characters`)
  .max(SECURITY.PASSWORD.MAX_LENGTH, `Password must be at most ${SECURITY.PASSWORD.MAX_LENGTH} characters`)
  .refine((val) => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
  .refine((val) => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
  .refine((val) => /[0-9]/.test(val), 'Password must contain at least one number')
  .refine((val) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val), 'Password must contain at least one special character');

/**
 * Phone number validation (Indian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian phone number');

/**
 * Register schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  role: z.enum(['CUSTOMER', 'SHOPKEEPER', 'B2B_CUSTOMER']).default('CUSTOMER'),
  // Optional initial profile fields
  shopName: z.string().min(2).optional(),
  shopAddress: z.string().min(5).optional(),
  businessName: z.string().min(2).optional(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST Number').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  phone: phoneSchema.optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone number is required',
  path: ['email'],
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

/**
 * Send OTP schema
 */
export const sendOtpSchema = z.object({
  identifier: z.string().min(3, 'Identifier is required'),
  channel: z.enum(['sms', 'email']).default('sms'),
});

/**
 * Verify OTP schema
 */
export const verifyOtpSchema = z.object({
  identifier: z.string().min(3, 'Identifier is required'),
  otp: z.string().length(SECURITY.TOKEN.OTP_LENGTH, `OTP must be ${SECURITY.TOKEN.OTP_LENGTH} digits`),
});

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * MFA setup schema
 */
export const mfaSetupSchema = z.object({
  password: z.string().min(1, 'Password is required to setup MFA'),
});

/**
 * MFA verify & activate schema
 */
export const mfaVerifySchema = z.object({
  code: z.string().min(6, 'MFA code or backup code is required').max(10),
});

/**
 * MFA login verify schema
 */
export const mfaLoginVerifySchema = z.object({
  tempToken: z.string().min(1, 'Temporary token is required'),
  code: z.string().min(6, 'Code must be at least 6 characters'),
});

/**
 * MFA disable schema
 */
export const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required to disable MFA'),
  code: z.string().min(6, 'MFA code is required to disable MFA'),
});

// Profile update schemas
export const updateCustomerProfileSchema = z.object({
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit PIN code').optional(),
  languagePref: z.enum(['hi', 'en', 'bn', 'te', 'ta', 'mr', 'gu']).optional(),
});

export const updateShopkeeperProfileSchema = z.object({
  shopName: z.string().min(2).max(100).optional(),
  shopAddress: z.string().min(5).max(255).optional(),
  shopCity: z.string().max(100).optional(),
  shopPincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit PIN code').optional(),
  category: z.string().max(100).optional(),
  upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format').optional(),
  deliveryEnabled: z.boolean().optional(),
  deliveryRadius: z.number().positive().max(50).optional(),
});

export const updateB2bProfileSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  tradeLicense: z.string().max(100).optional(),
  businessType: z.string().max(100).optional(),
  annualRevenue: z.number().nonnegative().optional(),
});

// Export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MfaSetupInput = z.infer<typeof mfaSetupSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type MfaLoginVerifyInput = z.infer<typeof mfaLoginVerifySchema>;
export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;
export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileSchema>;
export type UpdateShopkeeperProfileInput = z.infer<typeof updateShopkeeperProfileSchema>;
export type UpdateB2bProfileInput = z.infer<typeof updateB2bProfileSchema>;
