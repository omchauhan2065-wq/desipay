/**
 * Razorpay Configuration
 * ================================================
 * Initializes Razorpay SDK instance from env vars.
 * Provides health check for readiness probes.
 * 
 * Developed by: Om Chauhan
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env';
import { logger } from './logger';

let razorpayInstance: Razorpay | null = null;

/**
 * Get or create Razorpay instance (singleton)
 */
export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      logger.warn('Razorpay credentials not configured — payment features will be unavailable');
      throw new Error('Razorpay credentials not configured');
    }

    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    logger.info('✅ Razorpay SDK initialized');
  }

  return razorpayInstance;
}

/**
 * Verify Razorpay payment signature (HMAC-SHA256)
 * CRITICAL: This prevents payment tampering
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * Health check for Razorpay connectivity
 */
export async function checkRazorpayHealth(): Promise<{ status: string; configured: boolean }> {
  const configured = !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  
  if (!configured) {
    return { status: 'unconfigured', configured: false };
  }

  try {
    // Lightweight API call to verify credentials
    const rzp = getRazorpay();
    await (rzp as any).payments.all({ count: 1 });
    return { status: 'healthy', configured: true };
  } catch (error: any) {
    // 401 means bad creds, but connection works
    if (error?.statusCode === 401) {
      return { status: 'auth_error', configured: true };
    }
    return { status: 'connected', configured: true };
  }
}
