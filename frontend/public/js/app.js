/**
 * DesiPay Dashboard — Main Application Orchestrator
 * ===================================================================
 * SPA router, topbar live clock, JWT cockpit integration,
 * quick action dispatchers, presets, and notification ticker.
 * 
 * Developed by: Om Chauhan
 */

const app = {
  currentPage: 'auth',
  currentUser: null,

  async init() {
    // Initialize sub-modules
    auth.init();
    payments.init();
    khata.init();
    inventory.init();
    notifications.init();

    // Start Real-time Clock
    this.startLiveClock();

    // Setup Navigation Handlers
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page) this.navigateTo(page);
      });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      try { await api.post('/auth/logout'); } catch {}
      api.setToken(null);
      this.currentUser = null;
      this.showAuthPage();
      this.showToast('Signed out successfully', 'info');
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close Modals on overlay click or [data-close] buttons
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.close;
        const target = document.getElementById(targetId);
        if (target) target.style.display = 'none';
      });
    });

    // Setup JWT Cockpit Modal Triggers
    this.setupJwtTriggers();

    // Setup Dashboard Quick Actions
    this.setupQuickActions();

    // Setup Presets & Form Toggles
    this.setupFormEnhancements();

    // Check API health status
    this.checkApiStatus();

    // Update Topbar JWT Pill & listen for changes
    this.updateTopbarJwtPill();
    window.addEventListener('desipay:token-changed', () => {
      this.updateTopbarJwtPill();
    });

    // Check if user has active session
    if (api.isAuthenticated()) {
      try {
        const result = await api.get('/auth/me');
        if (result?.data?.user) {
          this.onLogin(result.data.user);
          return;
        }
      } catch {
        api.setToken(null);
      }
    }

    this.showAuthPage();
  },

  startLiveClock() {
    const clockEl = document.getElementById('liveClock');
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour12: false });
      if (clockEl) clockEl.textContent = `${timeStr} IST`;
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  setupJwtTriggers() {
    const openModal = () => {
      auth.renderJwtInspector();
      document.getElementById('jwtCockpitModal').style.display = 'flex';
    };

    const topbarPill = document.getElementById('topbarJwtPill');
    if (topbarPill) topbarPill.addEventListener('click', openModal);

    const openBtn = document.getElementById('openJwtModalBtn');
    if (openBtn) openBtn.addEventListener('click', openModal);

    const sidebarBtn = document.getElementById('sidebarJwtBtn');
    if (sidebarBtn) sidebarBtn.addEventListener('click', openModal);
  },

  setupQuickActions() {
    // Quick Pay
    const qaPayment = document.getElementById('qaPayment');
    if (qaPayment) {
      qaPayment.addEventListener('click', () => {
        this.navigateTo('payments');
        document.getElementById('paymentModal').style.display = 'flex';
      });
    }

    // Quick Khata
    const qaKhata = document.getElementById('qaKhata');
    if (qaKhata) {
      qaKhata.addEventListener('click', () => {
        this.navigateTo('khata');
        document.getElementById('khataModal').style.display = 'flex';
      });
    }

    // Quick Inventory
    const qaInventory = document.getElementById('qaInventory');
    if (qaInventory) {
      qaInventory.addEventListener('click', () => {
        this.navigateTo('inventory');
        document.getElementById('productModal').style.display = 'flex';
      });
    }

    // Quick JWT
    const qaJwt = document.getElementById('qaJwt');
    if (qaJwt) {
      qaJwt.addEventListener('click', () => {
        auth.renderJwtInspector();
        document.getElementById('jwtCockpitModal').style.display = 'flex';
      });
    }

    // View All shortcuts from Dashboard
    const viewAllPayments = document.getElementById('viewAllPaymentsBtn');
    if (viewAllPayments) {
      viewAllPayments.addEventListener('click', () => this.navigateTo('payments'));
    }

    const viewAllKhata = document.getElementById('viewAllKhataBtn');
    if (viewAllKhata) {
      viewAllKhata.addEventListener('click', () => this.navigateTo('khata'));
    }
  },

  setupFormEnhancements() {
    // Payment Presets
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.val;
        const input = document.getElementById('payAmount');
        if (input && val) {
          input.value = val;
          input.focus();
        }
      });
    });

    // Khata Entry Type Radio selector
    document.querySelectorAll('input[name="khataTypeRadio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const hidden = document.getElementById('khataType');
        if (hidden) hidden.value = e.target.value;
      });
    });
  },

  updateTopbarJwtPill() {
    const pill = document.getElementById('topbarJwtPill');
    const textEl = document.getElementById('topbarJwtText');
    if (!pill || !textEl) return;

    if (api.isAuthenticated()) {
      const remainingSecs = api.getTokenRemainingSeconds();
      const mins = Math.ceil(remainingSecs / 60);
      pill.classList.remove('inactive');
      textEl.textContent = `JWT Active (${mins}m)`;
    } else {
      pill.classList.add('inactive');
      textEl.textContent = 'JWT Inactive';
    }
  },

  onLogin(user) {
    this.currentUser = user;

    // Update Sidebar User Info
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('userAvatar').textContent = user.fullName.charAt(0).toUpperCase();
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'inline-flex';

    // Update Dashboard Banner
    const dashName = document.getElementById('dashGreetingName');
    if (dashName) dashName.textContent = user.fullName;
    const dashRole = document.getElementById('dashRoleLabel');
    if (dashRole) dashRole.textContent = user.role;

    this.updateTopbarJwtPill();
    this.navigateTo('dashboard');
    notifications.updateBadge();

    // Poll notifications every 30s
    setInterval(() => notifications.updateBadge(), 30000);
  },

  showAuthPage() {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById('page-auth').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'Account Portal';
    this.currentPage = 'auth';
    this.updateTopbarJwtPill();
  },

  navigateTo(page) {
    if (!api.isAuthenticated() && page !== 'auth') {
      this.showAuthPage();
      return;
    }

    // Hide all pages, display requested page
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(`page-${page}`);
    if (target) target.style.display = 'block';

    // Update nav active indicator
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update Topbar Title
    const titles = {
      dashboard: 'Dashboard Overview',
      payments: 'Payments & Razorpay Orders',
      khata: 'Digital Khata Ledger',
      inventory: 'Product Inventory & Catalog',
      notifications: 'Security & Alert Center',
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    this.currentPage = page;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Load data for requested view
    this.loadPageData(page);
  },

  async loadPageData(page) {
    switch (page) {
      case 'dashboard': await dashboard.load(); break;
      case 'payments': await payments.load(); break;
      case 'khata': await khata.load(); break;
      case 'inventory': await inventory.load(); break;
      case 'notifications': await notifications.load(); break;
    }
  },

  async checkApiStatus() {
    const statusEl = document.getElementById('apiStatus');
    try {
      const res = await fetch('http://localhost:3000/health');
      const data = await res.json();
      if (data?.success) {
        statusEl.textContent = '● API Online';
        statusEl.className = 'api-status connected';
      }
    } catch {
      statusEl.textContent = '● API Offline';
      statusEl.className = 'api-status error';
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
};

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => app.init());
