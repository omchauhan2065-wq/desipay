/**
 * Auth Routes Integration Tests
 * ================================================
 * End-to-end HTTP tests with Supertest against Express app.
 * 
 * Developed by: Om Chauhan
 */

import request from 'supertest';
import app from '../../src/app';

describe('Auth Endpoints Integration Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `supertest.${timestamp}@desipay.com`,
    phone: `+91987${String(timestamp).slice(-7)}`,
    password: 'SecurePassword#2026',
    confirmPassword: 'SecurePassword#2026',
    fullName: 'Integration Test User',
    role: 'CUSTOMER',
  };

  let accessToken = '';
  let refreshToken = '';

  it('POST /api/v1/auth/register should register a user and set cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();

    // Check Set-Cookie headers
    const rawCookies = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : [rawCookies || ''];
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c: string) => c.includes('access_token'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('refresh_token'))).toBe(true);

    accessToken = res.body.data.accessToken;
  });

  it('POST /api/v1/auth/login should authenticate user and issue tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();

    accessToken = res.body.data.accessToken;
    // Extract refresh_token from cookies
    const rawCookies = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : [rawCookies || ''];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
    if (refreshCookie) {
      refreshToken = refreshCookie.split(';')[0].replace('refresh_token=', '');
    }
  });

  it('GET /api/v1/auth/me should return current user when authenticated with Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('GET /api/v1/auth/me should reject unauthenticated request', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/send-otp should send verification OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({
        identifier: testUser.phone,
        channel: 'sms',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('POST /api/v1/auth/refresh should refresh access token', async () => {
    if (!refreshToken) return;

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/v1/auth/logout should clear cookies and log out', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
