/**
 * DesiPay Dashboard — Main App
 * ================================================
 * SPA router, page switching, toast system
 */

const app = {
  currentPage: 'auth',
  currentUser: null,

  async init() {
    // Initialize modules
    auth.init();
    payments.init();
    khata.init();
    inventory.init();
    notifications.init();

    // Navigation
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
      this.showToast('Logged out', 'info');
    });

    // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    // Check API status
    this.checkApiStatus();

    // Check if already authenticated
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

  onLogin(user) {
    this.currentUser = user;
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('userAvatar').textContent = user.fullName.charAt(0).toUpperCase();
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('logoutBtn').style.display = 'inline-flex';
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
    document.getElementById('pageTitle').textContent = 'Welcome';
    this.currentPage = 'auth';
  },

  navigateTo(page) {
    if (!api.isAuthenticated() && page !== 'auth') {
      this.showAuthPage();
      return;
    }

    // Hide all pages, show target
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(`page-${page}`);
    if (target) target.style.display = 'block';

    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Update title
    const titles = {
      dashboard: 'Dashboard',
      payments: 'Payments',
      khata: 'Khata Book',
      inventory: 'Inventory',
      notifications: 'Notifications',
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    this.currentPage = page;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');

    // Load page data
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
        statusEl.textContent = '● API Connected';
        statusEl.className = 'api-status connected';
      }
    } catch {
      statusEl.textContent = '● API Offline';
      statusEl.className = 'api-status error';
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
