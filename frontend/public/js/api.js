/**
 * DesiPay API Client
 * ================================================
 * Fetch wrapper with RS256 JWT token management,
 * token decoding, live expiration tracking, and auto-refresh.
 * 
 * Developed by: Om Chauhan
 */

const API_BASE = 'http://localhost:3000/api/v1';

const api = {
  token: localStorage.getItem('desipay_token') || null,

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('desipay_token', token);
    } else {
      localStorage.removeItem('desipay_token');
    }
    // Broadcast token update event across application
    window.dispatchEvent(new CustomEvent('desipay:token-changed', { 
      detail: { token, payload: this.getTokenPayload() } 
    }));
  },

  getToken() {
    return this.token;
  },

  isAuthenticated() {
    if (!this.token) return false;
    return !this.isTokenExpired();
  },

  /**
   * Safely decode a JWT token string into Header and Payload
   */
  parseJwt(token = this.token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
      const base64UrlDecode = (str) => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      };

      const header = base64UrlDecode(parts[0]);
      const payload = base64UrlDecode(parts[1]);
      const signature = parts[2] || '';

      return { header, payload, signature, raw: token };
    } catch (err) {
      console.warn('Failed to parse JWT:', err.message);
      return null;
    }
  },

  getTokenPayload() {
    const parsed = this.parseJwt(this.token);
    return parsed ? parsed.payload : null;
  },

  getTokenHeader() {
    const parsed = this.parseJwt(this.token);
    return parsed ? parsed.header : null;
  },

  getTokenRemainingSeconds() {
    const payload = this.getTokenPayload();
    if (!payload || !payload.exp) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  },

  isTokenExpired() {
    const remaining = this.getTokenRemainingSeconds();
    return remaining <= 0;
  },

  /**
   * Refresh the access token using HTTP-only cookie or current session
   */
  async refreshToken() {
    try {
      const res = await this.post('/auth/refresh', {});
      if (res?.data?.accessToken) {
        this.setToken(res.data.accessToken);
        return res.data.accessToken;
      }
      return null;
    } catch (err) {
      console.warn('Token refresh failed:', err.message);
      throw err;
    }
  },

  async request(method, path, body = null, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method,
      headers,
      credentials: 'include',
      ...options,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If 401 Unauthorized and not already on auth/refresh route, try one refresh attempt
        if (response.status === 401 && !path.includes('/auth/')) {
          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              // Retry request with new token
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, { ...config, headers });
              return await retryRes.json();
            }
          } catch {}
        }

        const errMsg = data?.error?.message || data?.message || 'Request failed';
        throw new Error(errMsg);
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to API server');
      }
      throw error;
    }
  },

  get(path) { return this.request('GET', path); },
  post(path, body) { return this.request('POST', path, body); },
  put(path, body) { return this.request('PUT', path, body); },
  patch(path, body) { return this.request('PATCH', path, body); },
  del(path) { return this.request('DELETE', path); },
};

window.api = api;
