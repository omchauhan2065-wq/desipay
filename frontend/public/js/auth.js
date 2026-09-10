/**
 * DesiPay Auth Module — 1-Click Demo Login & Live RS256 JWT Inspector
 * ===================================================================
 * Features:
 * - 1-Click Quick Demo Login for Shopkeeper, Customer, and B2B
 * - Password Show/Hide toggle
 * - Live JWT Token Cockpit with realtime expiration countdown
 * - Cryptographic Claims Inspector (Header, Payload, Algorithm)
 * - Colorized Raw Token Viewer (jwt.io style)
 * - 1-Click Token Copy, Refresh, and Manual Injection Testing
 * 
 * Developed by: Om Chauhan
 */

const DEMO_CREDENTIALS = {
  shopkeeper: {
    email: 'shopkeeper.live@desipay.com',
    password: 'Password@123',
    role: 'SHOPKEEPER',
    name: 'Om Kirana Store',
  },
  customer: {
    email: 'customer.live@desipay.com',
    password: 'Password@123',
    role: 'CUSTOMER',
    name: 'Aakash Kumar',
  },
  b2b: {
    email: 'b2b.live@desipay.com',
    password: 'Password@123',
    role: 'B2B_CUSTOMER',
    name: 'Apex Wholesale Ltd',
  },
};

const auth = {
  countdownTimerId: null,

  init() {
    this.setupTabs();
    this.setupDemoChips();
    this.setupPasswordToggle();
    this.setupForms();
    this.setupJwtActions();

    // Listen for global token change events
    window.addEventListener('desipay:token-changed', () => {
      this.renderJwtInspector();
    });

    // Initial render of JWT inspector state
    this.renderJwtInspector();
  },

  setupTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        const loginForm = document.getElementById('loginForm');
        const regForm = document.getElementById('registerForm');
        if (loginForm) loginForm.style.display = isLogin ? 'block' : 'none';
        if (regForm) regForm.style.display = isLogin ? 'none' : 'block';
      });
    });

    const toggleCustomBtn = document.getElementById('toggleCustomAuthBtn');
    const customContainer = document.getElementById('customAuthContainer');
    if (toggleCustomBtn && customContainer) {
      toggleCustomBtn.addEventListener('click', () => {
        const isHidden = customContainer.style.display === 'none';
        customContainer.style.display = isHidden ? 'block' : 'none';
        toggleCustomBtn.innerHTML = isHidden 
          ? '<span>📝</span> <span>Hide Manual Credentials Drawer ▴</span>' 
          : '<span>📝</span> <span>Manual Email & Password Sign In / Sign Up ▾</span>';
      });
    }
  },

  /**
   * 1-Click Demo Credentials:
   * Clicking fills credentials and immediately executes sign in!
   */
  setupDemoChips() {
    document.querySelectorAll('.demo-chip').forEach(chip => {
      chip.addEventListener('click', async () => {
        const roleKey = chip.dataset.role;
        const creds = DEMO_CREDENTIALS[roleKey];
        if (!creds) return;

        const emailInput = document.getElementById('loginEmail');
        const passInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = creds.email;
        if (passInput) passInput.value = creds.password;

        app.showToast(`1-Click Demo: Signing in as ${creds.name} (${creds.role})...`, 'info');

        // Automatically trigger form submission
        await this.executeLogin(creds.email, creds.password);
      });
    });
  },

  setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passInput = document.getElementById('loginPassword');
    if (!toggleBtn || !passInput) return;

    toggleBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
    });
  },

  setupForms() {
    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        await this.executeLogin(email, password);
      });
    }

    // Register Form Submission
    const regForm = document.getElementById('registerForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('registerError');
        if (errEl) errEl.textContent = '';

        const password = document.getElementById('regPassword')?.value;
        const confirm = document.getElementById('regConfirm')?.value;

        if (password !== confirm) {
          if (errEl) errEl.textContent = 'Passwords do not match';
          return;
        }

        try {
          const result = await api.post('/auth/register', {
            fullName: document.getElementById('regName')?.value.trim(),
            email: document.getElementById('regEmail')?.value.trim(),
            phone: document.getElementById('regPhone')?.value.trim(),
            password,
            confirmPassword: confirm,
            role: document.getElementById('regRole')?.value,
          });

          if (result.data?.accessToken) {
            api.setToken(result.data.accessToken);
            app.onLogin(result.data.user);
            app.showToast('Account registered via RS256 JWT!', 'success');
          }
        } catch (error) {
          if (errEl) errEl.textContent = error.message;
        }
      });
    }
  },

  async executeLogin(email, password) {
    const errEl = document.getElementById('loginError');
    if (errEl) errEl.textContent = '';

    try {
      const result = await api.post('/auth/login', { email, password });

      if (result.data?.accessToken) {
        api.setToken(result.data.accessToken);
        app.onLogin(result.data.user);
        app.showToast(`Welcome back, ${result.data.user.fullName}!`, 'success');
      } else if (result.data?.mfaRequired) {
        if (errEl) errEl.textContent = 'MFA verification required for this account';
      }
    } catch (error) {
      if (errEl) errEl.textContent = error.message;
      app.showToast(error.message, 'error');
    }
  },

  setupJwtActions() {
    // 1-Click Copy Token
    const copyTokenHandler = () => {
      const token = api.getToken();
      if (!token) {
        app.showToast('No active JWT token to copy', 'error');
        return;
      }
      navigator.clipboard.writeText(token).then(() => {
        app.showToast('RS256 Bearer Token copied to clipboard!', 'success');
      }).catch(() => {
        app.showToast('Failed to copy token', 'error');
      });
    };

    const copyBtn = document.getElementById('copyJwtBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyTokenHandler);

    // Refresh Token Action
    const refreshTokenHandler = async () => {
      try {
        app.showToast('Requesting refreshed access token...', 'info');
        const newToken = await api.refreshToken();
        if (newToken) {
          app.showToast('JWT Access Token refreshed! Lifespan extended to 15m.', 'success');
          this.renderJwtInspector();
        }
      } catch (err) {
        app.showToast(err.message || 'Token refresh failed', 'error');
      }
    };

    const refreshBtn = document.getElementById('refreshJwtBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshTokenHandler);

    // Clear Token Action
    const clearTokenHandler = () => {
      api.setToken(null);
      this.renderJwtInspector();
      app.showToast('JWT Token purged. Protected requests will now be rejected.', 'info');
    };

    const clearBtn = document.getElementById('clearJwtBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearTokenHandler);

    // Logout Action
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await api.post('/auth/logout').catch(() => {});
        } finally {
          api.setToken(null);
          app.currentUser = null;
          app.updateAuthUI(null);
          this.renderJwtInspector();
          app.showToast('Signed out of DesiPay. Protected APIs now locked.', 'info');
        }
      });
    }

    // Inject / Test Custom Token Modal
    const injectBtn = document.getElementById('injectJwtBtn');
    const jwtModal = document.getElementById('jwtCockpitModal');
    const closeJwtModalBtn = document.getElementById('closeJwtCockpitBtn');

    if (injectBtn && jwtModal) {
      injectBtn.addEventListener('click', () => {
        jwtModal.style.display = 'flex';
        const input = document.getElementById('customJwtInput');
        if (input) {
          input.value = api.getToken() || '';
          input.focus();
        }
      });
    }

    if (closeJwtModalBtn && jwtModal) {
      closeJwtModalBtn.addEventListener('click', () => {
        jwtModal.style.display = 'none';
      });
    }

    // Paste from clipboard button
    const pasteBtn = document.getElementById('pasteClipboardJwtBtn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          const input = document.getElementById('customJwtInput');
          if (input) {
            input.value = text.trim();
            app.showToast('Pasted token from clipboard!', 'info');
          }
        } catch {
          app.showToast('Clipboard access denied. Please paste directly into text box.', 'error');
        }
      });
    }

    const applyCustomBtn = document.getElementById('applyCustomJwtBtn');
    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', async () => {
        const input = document.getElementById('customJwtInput');
        const customToken = input?.value?.trim();
        if (!customToken) {
          app.showToast('Please paste a JWT token to test', 'error');
          return;
        }

        try {
          // Set token and test against /auth/me
          api.setToken(customToken);
          const res = await api.get('/auth/me');
          if (res?.data?.user) {
            app.onLogin(res.data.user);
            app.showToast(`Custom token validated! Signed in as ${res.data.user.fullName}`, 'success');
            if (jwtModal) jwtModal.style.display = 'none';
          }
        } catch (err) {
          app.showToast(`Custom token rejected: ${err.message}`, 'error');
          this.renderJwtInspector();
        }
      });
    }
  },

  /**
   * Renders the complete cryptographic inspection of the active JWT token
   */
  renderJwtInspector() {
    const token = api.getToken();
    const parsed = api.parseJwt(token);

    const badgeEl = document.getElementById('jwtStatusBadge');
    const statusTextEl = document.getElementById('jwtStatusText');
    const roleEl = document.getElementById('jwtClaimRole');
    const algEl = document.getElementById('jwtClaimAlg');
    const userEl = document.getElementById('jwtClaimUserId');
    const sessionEl = document.getElementById('jwtClaimSessionId');
    const rawBox = document.getElementById('rawJwtBox');

    // Modal elements
    const modalBadgeEl = document.getElementById('modalJwtStatusBadge');
    const modalStatusTextEl = document.getElementById('modalJwtStatusText');
    const modalJsonBox = document.getElementById('modalClaimsJson');
    const modalRawBox = document.getElementById('modalRawJwtBox');

    if (parsed && !api.isTokenExpired()) {
      const { header, payload, signature, raw } = parsed;

      // Status Badge
      if (badgeEl) {
        badgeEl.classList.add('active');
        statusTextEl.textContent = '🟢 Active (RS256)';
      }
      if (modalBadgeEl) {
        modalBadgeEl.classList.add('active');
        modalStatusTextEl.textContent = '🟢 Active (RS256 Verified)';
      }

      // Claims
      if (roleEl) roleEl.textContent = payload.role || 'USER';
      if (algEl) algEl.textContent = header.alg || 'RS256';
      if (userEl) userEl.textContent = payload.userId || 'N/A';
      if (sessionEl) sessionEl.textContent = payload.sessionId || 'N/A';

      // Colorized Raw Token: Red Header, Purple Payload, Cyan Signature
      const parts = raw.split('.');
      const colorizedHtml = `
        <span class="jwt-header-part" title="Algorithm & Token Type (Header)">${parts[0]}</span>
        <span class="jwt-dot">.</span>
        <span class="jwt-payload-part" title="Cryptographic Claims (Payload)">${parts[1]}</span>
        <span class="jwt-dot">.</span>
        <span class="jwt-signature-part" title="4096-bit RSA Signature">${parts[2] || ''}</span>
      `;

      if (rawBox) rawBox.innerHTML = colorizedHtml;
      if (modalRawBox) modalRawBox.innerHTML = colorizedHtml;

      // Modal JSON tree
      if (modalJsonBox) {
        modalJsonBox.textContent = JSON.stringify({
          header,
          payload,
          verified: true,
          algorithm: header.alg || 'RS256',
        }, null, 2);
      }

      // Start ticker
      this.startCountdownTicker();
    } else {
      // Inactive / Expired State
      if (badgeEl) {
        badgeEl.classList.remove('active');
        statusTextEl.textContent = '⚪ No Active Token';
      }
      if (modalBadgeEl) {
        modalBadgeEl.classList.remove('active');
        modalStatusTextEl.textContent = '⚪ No Active Token';
      }

      if (roleEl) roleEl.textContent = 'GUEST';
      if (algEl) algEl.textContent = 'RS256';
      if (userEl) userEl.textContent = 'None';
      if (sessionEl) sessionEl.textContent = 'None';

      const placeholder = '<span class="jwt-placeholder">Log in using any demo credentials to inspect your live RS256 JWT bearer token.</span>';
      if (rawBox) rawBox.innerHTML = placeholder;
      if (modalRawBox) modalRawBox.innerHTML = '<span class="jwt-placeholder">No active token.</span>';

      if (modalJsonBox) {
        modalJsonBox.textContent = JSON.stringify({
          status: 'unauthenticated',
          message: 'No active JWT token found in localStorage.',
        }, null, 2);
      }

      this.stopCountdownTicker();
      const timerEl = document.getElementById('jwtTimerText');
      if (timerEl) timerEl.textContent = '--:--';
      const progressEl = document.getElementById('jwtProgressBar');
      if (progressEl) progressEl.style.width = '0%';
      const modalTimerEl = document.getElementById('modalJwtTimerText');
      if (modalTimerEl) modalTimerEl.textContent = '--:--';
    }
  },

  startCountdownTicker() {
    this.stopCountdownTicker();

    const update = () => {
      const remaining = api.getTokenRemainingSeconds();
      const timerEl = document.getElementById('jwtTimerText');
      const progressEl = document.getElementById('jwtProgressBar');
      const modalTimerEl = document.getElementById('modalJwtTimerText');

      if (remaining <= 0) {
        if (timerEl) timerEl.textContent = 'Expired';
        if (modalTimerEl) modalTimerEl.textContent = 'Expired';
        if (progressEl) progressEl.style.width = '0%';
        this.renderJwtInspector();
        return;
      }

      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      if (timerEl) timerEl.textContent = formatted;
      if (modalTimerEl) modalTimerEl.textContent = formatted;

      // 15 minutes = 900 seconds
      const pct = Math.min(100, Math.max(0, (remaining / 900) * 100));
      if (progressEl) progressEl.style.width = `${pct}%`;
    };

    update();
    this.countdownTimerId = setInterval(update, 1000);
  },

  stopCountdownTicker() {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  },
};
