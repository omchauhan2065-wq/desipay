/**
 * DesiPay — Commercial Application Orchestrator
 * ===================================================================
 * Dual-Persona Engine:
 * 1. 🎓 Campus Quick-Commerce Store (Blinkit & Swiggy Instamart)
 * 2. 🏪 Vyapar POS & Smart Khata (BharatPe & Khatabook)
 * 
 * Features:
 * - Real-time Product Catalog with [ - 1 + ] spring steppers
 * - Sticky Floating Cart Dock & Slideout Drawer
 * - DesiPay 4G Smart Soundbox with Hindi audio speech synthesis
 * - Khatabook 1-Click WhatsApp Payment Reminders
 * - Mode Switcher, Campus Location Picker, and RS256 JWT Security
 * 
 * Developed by: Om Chauhan
 */

// Bestseller Campus Catalog (Blinkit / Swiggy Instamart)
const CAMPUS_CATALOG = [
  {
    id: 'prod-maggi',
    name: 'Maggi 2-Minute Special Masala Noodles',
    pack: '280g (Pack of 4)',
    mrp: 65,
    price: 56,
    discount: '14% OFF',
    category: 'maggi',
    emoji: '🍜',
    isVeg: true,
  },
  {
    id: 'prod-redbull',
    name: 'Red Bull Energy Drink (Can)',
    pack: '250ml Can',
    mrp: 125,
    price: 115,
    discount: '8% OFF',
    category: 'drinks',
    emoji: '🥤',
    isVeg: true,
  },
  {
    id: 'prod-sting',
    name: 'Sting Energy Drink Bottle',
    pack: '250ml Pet Bottle',
    mrp: 20,
    price: 20,
    discount: 'HOT',
    category: 'drinks',
    emoji: '⚡',
    isVeg: true,
  },
  {
    id: 'prod-lays',
    name: "Lay's India's Magic Masala Chips",
    pack: '50g Party Pack',
    mrp: 20,
    price: 20,
    discount: 'TOP',
    category: 'munchies',
    emoji: '🍿',
    isVeg: true,
  },
  {
    id: 'prod-amul-milk',
    name: 'Amul Taaza Homogenised Toned Milk',
    pack: '1 Litre Tetra Pack',
    mrp: 56,
    price: 54,
    discount: '4% OFF',
    category: 'dairy',
    emoji: '🥛',
    isVeg: true,
  },
  {
    id: 'prod-notebook',
    name: 'Classmate Pulse Spiral Notebook A4',
    pack: '160 Pages Single Line',
    mrp: 75,
    price: 65,
    discount: '13% OFF',
    category: 'stationery',
    emoji: '📚',
    isVeg: true,
  },
  {
    id: 'prod-waiwai',
    name: 'Wai Wai 1-2-3 Ready to Eat Noodles',
    pack: '70g Spicy Chicken Style',
    mrp: 15,
    price: 15,
    discount: 'CAMPUS',
    category: 'maggi',
    emoji: '🥢',
    isVeg: true,
  },
  {
    id: 'prod-silk',
    name: 'Cadbury Dairy Milk Silk Chocolate Bar',
    pack: '60g Pure Cocoa',
    mrp: 95,
    price: 85,
    discount: '10% OFF',
    category: 'chocolates',
    emoji: '🍫',
    isVeg: true,
  },
];

const app = {
  currentMode: 'campus', // 'campus' | 'dukandaar'
  currentPage: 'home',
  currentUser: null,
  cart: {}, // { productId: qty }

  async init() {
    // Sub-modules initialization
    auth.init();
    payments.init();
    khata.init();
    inventory.init();
    notifications.init();

    // Mode Switcher (Campus ↔ Dukandaar)
    this.setupModeSwitcher();

    // Campus Catalog & Cart
    this.renderCampusCatalog('all');
    this.setupCampusCart();

    // Dukandaar Hardware & Ledger Tools
    this.setupDukandaarTools();

    // Navigation & Modals
    this.setupNavigation();
    this.setupLocationPicker();

    // Check API Status
    this.checkApiStatus();

    // Check if user is logged in
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

    // Default to Campus Mode for guest
    this.switchPortalMode('campus');
  },

  // =========================================================================
  // DUAL-PERSONA MODE SWITCHER
  // =========================================================================

  setupModeSwitcher() {
    const btnCampus = document.getElementById('modeBtnCampus');
    const btnDukandaar = document.getElementById('modeBtnDukandaar');

    if (btnCampus) {
      btnCampus.addEventListener('click', () => this.switchPortalMode('campus'));
    }
    if (btnDukandaar) {
      btnDukandaar.addEventListener('click', () => this.switchPortalMode('dukandaar'));
    }
  },

  switchPortalMode(mode) {
    this.currentMode = mode;
    document.body.className = `mode-${mode}`;

    const btnCampus = document.getElementById('modeBtnCampus');
    const btnDukandaar = document.getElementById('modeBtnDukandaar');
    const campusView = document.getElementById('campusPortalView');
    const dukandaarView = document.getElementById('dukandaarPortalView');
    const sbModeEmoji = document.getElementById('sbModeEmoji');
    const sbModeLabel = document.getElementById('sbModeLabel');

    if (mode === 'campus') {
      btnCampus.classList.add('active');
      btnDukandaar.classList.remove('active');
      campusView.style.display = 'block';
      dukandaarView.style.display = 'none';
      if (sbModeEmoji) sbModeEmoji.textContent = '🎓';
      if (sbModeLabel) sbModeLabel.textContent = 'Campus Student Mode';
      this.updateCartUI(); // show cart dock if items exist
    } else {
      btnDukandaar.classList.add('active');
      btnCampus.classList.remove('active');
      dukandaarView.style.display = 'block';
      campusView.style.display = 'none';
      if (sbModeEmoji) sbModeEmoji.textContent = '🏪';
      if (sbModeLabel) sbModeLabel.textContent = 'Vyapar / Dukandaar POS';
      // Hide student cart dock in dukandaar mode
      const dock = document.getElementById('floatingCartDock');
      if (dock) dock.style.display = 'none';
      // Load Vyapar Data
      this.loadVyaparData();
    }

    // Hide any other subpages
    document.querySelectorAll('.portal-view:not(#campusPortalView):not(#dukandaarPortalView)').forEach(p => p.style.display = 'none');
  },

  // =========================================================================
  // CAMPUS STORE CATALOG & CART SYSTEM (BLINKIT & SWIGGY)
  // =========================================================================

  renderCampusCatalog(category = 'all', searchQuery = '') {
    const grid = document.getElementById('campusProductGrid');
    if (!grid) return;

    let items = CAMPUS_CATALOG;
    if (category !== 'all') {
      items = items.filter(item => item.category === category);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(q) || item.pack.toLowerCase().includes(q));
    }

    document.getElementById('productCountLabel').textContent = `(${items.length} Items)`;

    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No products found matching your search. Try "Maggi", "Red Bull", or "Chips".</div>';
      return;
    }

    grid.innerHTML = items.map(item => {
      const qty = this.cart[item.id] || 0;
      return `
        <div class="product-card" data-id="${item.id}">
          <div class="card-top-badges">
            <span class="badge-time">⚡ 8 MINS</span>
            <span class="badge-discount">${item.discount}</span>
          </div>

          <div class="product-visual">
            <div class="veg-indicator"><span class="veg-dot"></span></div>
            <span>${item.emoji}</span>
          </div>

          <div class="product-info">
            <h4 class="product-title" title="${item.name}">${item.name}</h4>
            <span class="product-unit">${item.pack}</span>

            <div class="product-bottom-row">
              <div class="price-group">
                <span class="selling-price">₹${item.price}</span>
                ${item.mrp > item.price ? `<span class="mrp-strike">₹${item.mrp}</span>` : ''}
              </div>

              <div class="product-action-box" id="actionBox-${item.id}">
                ${qty === 0 
                  ? `<button type="button" class="btn-add-product" onclick="app.addToCart('${item.id}')">ADD</button>` 
                  : `
                    <div class="stepper-container">
                      <button type="button" class="step-btn" onclick="app.updateQty('${item.id}', -1)">−</button>
                      <span class="step-count">${qty}</span>
                      <button type="button" class="step-btn" onclick="app.updateQty('${item.id}', 1)">+</button>
                    </div>
                  `
                }
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  setupCampusCart() {
    // Category pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderCampusCatalog(pill.dataset.cat);
      });
    });

    // Trending chips
    document.querySelectorAll('.trend-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.search;
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.value = query;
        this.renderCampusCatalog('all', query);
      });
    });

    // Global search input
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderCampusCatalog('all', e.target.value.trim());
      });
    }

    // Open Cart Drawer triggers
    const headerCartBtn = document.getElementById('headerCartBtn');
    if (headerCartBtn) headerCartBtn.addEventListener('click', () => this.openCartDrawer());

    const dockCheckoutBtn = document.getElementById('dockCheckoutBtn');
    if (dockCheckoutBtn) dockCheckoutBtn.addEventListener('click', () => this.openCartDrawer());

    const closeDrawerBtn = document.getElementById('closeCartDrawerBtn');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => this.closeCartDrawer());

    const drawerOverlay = document.getElementById('cartDrawerOverlay');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (e) => {
        if (e.target === drawerOverlay) this.closeCartDrawer();
      });
    }

    // Checkout via UPI Button in Drawer
    const payUpiBtn = document.getElementById('btnPayUpiCart');
    if (payUpiBtn) {
      payUpiBtn.addEventListener('click', async () => {
        const total = this.getCartTotal();
        if (total <= 0) {
          this.showToast('Your cart is empty', 'error');
          return;
        }

        try {
          this.showToast(`Initiating UPI payment order for ₹${total}...`, 'info');
          const res = await api.post('/payments/order', {
            amount: total,
            description: 'Campus 10-Min Quick Order (DesiPay)',
          });

          this.closeCartDrawer();
          this.cart = {};
          this.updateCartUI();
          this.renderCampusCatalog();

          this.showToast(`UPI Order Created! Razorpay ID: ${res.data.razorpayOrderId}`, 'success');

          // Trigger soundbox voice confirmation if Dukandaar is listening!
          this.speakSoundbox(total);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Student Khata Settle via UPI
    const settleKhataBtn = document.getElementById('settleKhataUpiBtn');
    if (settleKhataBtn) {
      settleKhataBtn.addEventListener('click', () => {
        document.getElementById('paymentModal').style.display = 'flex';
        document.getElementById('payAmount').value = 180;
        document.getElementById('payDesc').value = 'Settling Sharma Ji Canteen Khata';
      });
    }

    // Split Bill Button
    const splitBillBtn = document.getElementById('splitBillBtn');
    if (splitBillBtn) {
      splitBillBtn.addEventListener('click', () => {
        this.showToast('Bill Splitter: ₹180 split with 2 roommates = ₹90 per person. Shared on WhatsApp!', 'info');
      });
    }
  },

  addToCart(productId) {
    this.cart[productId] = (this.cart[productId] || 0) + 1;
    this.updateCartUI();
    this.updateActionBox(productId);
  },

  updateQty(productId, delta) {
    const current = this.cart[productId] || 0;
    const next = current + delta;
    if (next <= 0) {
      delete this.cart[productId];
    } else {
      this.cart[productId] = next;
    }
    this.updateCartUI();
    this.updateActionBox(productId);
  },

  updateActionBox(productId) {
    const box = document.getElementById(`actionBox-${productId}`);
    if (!box) return;
    const qty = this.cart[productId] || 0;

    if (qty === 0) {
      box.innerHTML = `<button type="button" class="btn-add-product" onclick="app.addToCart('${productId}')">ADD</button>`;
    } else {
      box.innerHTML = `
        <div class="stepper-container">
          <button type="button" class="step-btn" onclick="app.updateQty('${productId}', -1)">−</button>
          <span class="step-count">${qty}</span>
          <button type="button" class="step-btn" onclick="app.updateQty('${productId}', 1)">+</button>
        </div>
      `;
    }
  },

  getCartCount() {
    return Object.values(this.cart).reduce((sum, q) => sum + q, 0);
  },

  getCartTotal() {
    return Object.entries(this.cart).reduce((sum, [id, qty]) => {
      const p = CAMPUS_CATALOG.find(item => item.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);
  },

  updateCartUI() {
    const count = this.getCartCount();
    const total = this.getCartTotal();

    // Topbar Cart Button
    const headerCount = document.getElementById('headerCartCount');
    const headerTotal = document.getElementById('headerCartTotal');
    if (headerCount) headerCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    if (headerTotal) headerTotal.textContent = `₹${total}`;

    // Floating Bottom Dock (Blinkit style)
    const dock = document.getElementById('floatingCartDock');
    const dockCount = document.getElementById('dockCartCount');
    const dockTotal = document.getElementById('dockCartTotal');

    if (dock && this.currentMode === 'campus') {
      if (count > 0) {
        dock.style.display = 'flex';
        dockCount.textContent = count;
        dockTotal.textContent = `₹${total.toFixed(2)}`;
      } else {
        dock.style.display = 'none';
      }
    }
  },

  openCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    const list = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('billSubtotal');
    const grandTotalEl = document.getElementById('billGrandTotal');

    const total = this.getCartTotal();
    const items = Object.entries(this.cart).map(([id, qty]) => {
      const p = CAMPUS_CATALOG.find(item => item.id === id);
      return { ...p, qty };
    });

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state">Your campus cart is empty. Add Maggi, Red Bull, or snacks!</div>';
    } else {
      list.innerHTML = items.map(item => `
        <div class="drawer-item-row">
          <div class="dir-item-info">
            <strong>${item.name}</strong>
            <span>${item.pack} • ₹${item.price} each</span>
          </div>
          <div class="stepper-container">
            <button type="button" class="step-btn" onclick="app.updateQty('${item.id}', -1)">−</button>
            <span class="step-count">${item.qty}</span>
            <button type="button" class="step-btn" onclick="app.updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `₹${total.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${total.toFixed(2)}`;

    overlay.style.display = 'flex';
  },

  closeCartDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  // =========================================================================
  // DUKANDAAR / VYAPAR TOOLS (BHARATPE & KHATABOOK)
  // =========================================================================

  setupDukandaarTools() {
    // Test Soundbox Voice button
    const testSoundboxBtn = document.getElementById('testSoundboxVoiceBtn');
    if (testSoundboxBtn) {
      testSoundboxBtn.addEventListener('click', () => {
        this.speakSoundbox(150);
      });
    }

    // Print Standee
    const printStandeeBtn = document.getElementById('printQrStandBtn');
    if (printStandeeBtn) {
      printStandeeBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Share QR on WhatsApp
    const shareQrBtn = document.getElementById('shareQrWhatsAppBtn');
    if (shareQrBtn) {
      shareQrBtn.addEventListener('click', () => {
        const text = encodeURIComponent(
          "Namaste! Om Kirana Store ka DesiPay UPI QR code payment ke liye live hai: VPA ID omkirana@desipay. Sabhi apps (GPay, PhonePe, Paytm, BHIM) se payment bhej sakte hain!"
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    }

    // Quick Action Buttons
    const btnPayIn = document.getElementById('btnVyaparPaymentIn');
    if (btnPayIn) {
      btnPayIn.addEventListener('click', () => {
        document.getElementById('paymentModal').style.display = 'flex';
      });
    }

    const btnUdharOut = document.getElementById('btnVyaparUdharOut');
    if (btnUdharOut) {
      btnUdharOut.addEventListener('click', () => {
        document.getElementById('khataModal').style.display = 'flex';
      });
    }

    const refreshLedgerBtn = document.getElementById('dukandaarRefreshLedgerBtn');
    if (refreshLedgerBtn) {
      refreshLedgerBtn.addEventListener('click', () => this.loadVyaparData());
    }
  },

  /**
   * DesiPay Smart 4G Soundbox:
   * Plays realistic payment chime followed by Hindi voice announcement!
   */
  speakSoundbox(amount = 150) {
    this.showToast(`🔊 Soundbox Alert: "देसीपे पर ₹${amount} प्राप्त हुए!"`, 'success');

    // 1. Dual-Tone Chime using Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {}

    // 2. Hindi Voice Speech Synthesis
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `देसीपे पर ${amount} रुपये प्राप्त हुए! ${amount} Rupees received on DesiPay!`;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.pitch = 1.05;

        // Try to pick Indian English or Hindi voice
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => 
          v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Hindi')
        );
        if (indianVoice) utter.voice = indianVoice;

        window.speechSynthesis.speak(utter);
      }
    }, 450);
  },

  /**
   * Load Vyapar / Khatabook Ledger Data with WhatsApp Reminders
   */
  async loadVyaparData() {
    try {
      const res = await api.get('/khata/dashboard').catch(() => ({ data: {} }));
      const debtorsBody = document.getElementById('vyaparDebtorsBody');
      if (!debtorsBody) return;

      const debtors = res?.data?.topDebtors || [
        { fullName: 'Rahul Verma (Student)', phone: '+919800000002', balance: 450.00, lastDate: 'Today' },
        { fullName: 'Aman Deep (Hostel 3)', phone: '+919800000003', balance: 320.00, lastDate: 'Yesterday' },
        { fullName: 'Priya Sharma (Hostel 2)', phone: '+919800000004', balance: 180.00, lastDate: '08 Sep' },
        { fullName: 'Vikram Singh (Canteen)', phone: '+919800000005', balance: 650.00, lastDate: '07 Sep' }
      ];

      debtorsBody.innerHTML = debtors.map(d => {
        const phoneClean = (d.phone || '+919800000002').replace(/[^0-9]/g, '');
        const reminderText = encodeURIComponent(
          `Namaste ${d.fullName} ji! 🙏\n\nOm Kirana Store par aapka ₹${d.balance.toFixed(2)} ka udhar baaki hai.\nKripya is DesiPay UPI link se payment kar dijiye:\nhttp://localhost:3001\n\nDhanyawad!`
        );
        const waLink = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${reminderText}`;

        return `
          <tr>
            <td>
              <strong style="color:#ffffff">${d.fullName}</strong>
            </td>
            <td><code style="color:var(--text-muted)">${d.phone || '-'}</code></td>
            <td><strong style="color:var(--danger);font-size:1rem">₹${d.balance.toFixed(2)}</strong></td>
            <td>${d.lastDate || 'Recent'}</td>
            <td>
              <a href="${waLink}" target="_blank" class="btn-whatsapp-reminder" title="Send pre-filled payment reminder on WhatsApp">
                <span>📲</span>
                <span>WhatsApp Reminder</span>
              </a>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.warn('Vyapar load error:', err.message);
    }
  },

  // =========================================================================
  // NAVIGATION & MODALS
  // =========================================================================

  setupNavigation() {
    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarCloseBtn');

    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // Sidebar navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (sidebar) sidebar.classList.remove('open');

        if (page === 'home') {
          this.switchPortalMode(this.currentMode);
        } else if (page === 'soundbox' || page === 'qrstand') {
          this.switchPortalMode('dukandaar');
        } else {
          this.navigateToSubpage(page);
        }
      });
    });

    // Header Auth Button
    const headerAuthBtn = document.getElementById('headerAuthBtn');
    if (headerAuthBtn) {
      headerAuthBtn.addEventListener('click', () => {
        if (api.isAuthenticated()) {
          this.navigateToSubpage('auth');
        } else {
          this.navigateToSubpage('auth');
        }
      });
    }

    // Header JWT Pill -> Open JWT Cockpit Modal
    const topbarJwtPill = document.getElementById('topbarJwtPill');
    if (topbarJwtPill) {
      topbarJwtPill.addEventListener('click', () => {
        auth.renderJwtInspector();
        document.getElementById('jwtCockpitModal').style.display = 'flex';
      });
    }

    const sidebarJwtBtn = document.getElementById('sidebarJwtBtn');
    if (sidebarJwtBtn) {
      sidebarJwtBtn.addEventListener('click', () => {
        auth.renderJwtInspector();
        document.getElementById('jwtCockpitModal').style.display = 'flex';
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try { await api.post('/auth/logout'); } catch {}
        api.setToken(null);
        this.currentUser = null;
        this.updateAuthUI(null);
        this.switchPortalMode('campus');
        this.showToast('Signed out', 'info');
      });
    }

    // Close Modals
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.close);
        if (target) target.style.display = 'none';
      });
    });
  },

  navigateToSubpage(page) {
    document.getElementById('campusPortalView').style.display = 'none';
    document.getElementById('dukandaarPortalView').style.display = 'none';
    const dock = document.getElementById('floatingCartDock');
    if (dock) dock.style.display = 'none';

    document.querySelectorAll('.portal-view:not(#campusPortalView):not(#dukandaarPortalView)').forEach(p => p.style.display = 'none');

    const target = document.getElementById(`page-${page}`);
    if (target) target.style.display = 'block';

    // Load subpage data
    switch (page) {
      case 'payments': payments.load(); break;
      case 'khata': khata.load(); break;
      case 'inventory': inventory.load(); break;
      case 'notifications': notifications.load(); break;
    }
  },

  setupLocationPicker() {
    const locBtn = document.getElementById('locationPickerBtn');
    const locModal = document.getElementById('locationModal');
    if (locBtn && locModal) {
      locBtn.addEventListener('click', () => {
        locModal.style.display = 'flex';
      });

      document.querySelectorAll('.location-item').forEach(item => {
        item.addEventListener('click', () => {
          document.querySelectorAll('.location-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const locName = item.dataset.loc;
          document.getElementById('currentLocationText').textContent = `${locName} ▾`;
          locModal.style.display = 'none';
          this.showToast(`Delivery location updated: ${locName}`, 'success');
        });
      });
    }
  },

  onLogin(user) {
    this.currentUser = user;
    this.updateAuthUI(user);

    // Auto-switch mode based on role
    if (user.role === 'SHOPKEEPER') {
      this.switchPortalMode('dukandaar');
      this.showToast(`Dukandaar Mode Active: Welcome ${user.fullName}!`, 'success');
    } else {
      this.switchPortalMode('campus');
      this.showToast(`Campus Store Active: Welcome ${user.fullName}!`, 'success');
    }
  },

  updateAuthUI(user) {
    const headerAuthBtn = document.getElementById('headerAuthBtn');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const topbarPill = document.getElementById('topbarJwtPill');
    const topbarJwtText = document.getElementById('topbarJwtText');

    if (user && api.isAuthenticated()) {
      if (headerAuthBtn) headerAuthBtn.textContent = user.fullName.split(' ')[0];
      if (userInfo) {
        document.getElementById('userName').textContent = user.fullName;
        document.getElementById('userRole').textContent = user.role;
        document.getElementById('userAvatar').textContent = user.fullName.charAt(0).toUpperCase();
        userInfo.style.display = 'flex';
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';

      if (topbarPill && topbarJwtText) {
        topbarPill.classList.remove('inactive');
        topbarJwtText.textContent = `JWT Active (15m)`;
      }
    } else {
      if (headerAuthBtn) headerAuthBtn.textContent = 'Sign In';
      if (userInfo) userInfo.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';

      if (topbarPill && topbarJwtText) {
        topbarPill.classList.add('inactive');
        topbarJwtText.textContent = 'JWT Inactive';
      }
    }
  },

  async checkApiStatus() {
    const pill = document.getElementById('topbarJwtPill');
    try {
      const res = await fetch('http://localhost:3000/health');
      const data = await res.json();
      if (data?.success) {
        // healthy
      }
    } catch {
      console.warn('Backend API appears offline.');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '❌', info: '⚡' };
    toast.innerHTML = `<span>${icons[type] || '⚡'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => app.init());
