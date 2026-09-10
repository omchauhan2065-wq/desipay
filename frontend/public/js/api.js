/**
 * DesiPay API Client
 * ================================================
 * Fetch wrapper with JWT token management
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
  },

  getToken() {
    return this.token;
  },

  isAuthenticated() {
    return !!this.token;
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
