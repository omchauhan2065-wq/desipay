/**
 * DesiPay — Mobile-First Application Orchestrator
 * ===================================================================
 * Built for Mobile Ergonomics (Thumb Zone) & User Psychology:
 * - 5-Tab Native Mobile Bottom Navigation (Store, Khata, Soundbox, UPI, Account)
 * - Blinkit/Swiggy 2-Column Campus Catalog with [ - 1 + ] steppers
 * - Sticky Floating Cart Dock & Slide-Up Bottom Sheets
 * - DesiPay 4G Smart Soundbox with Hindi audio voice announcement
 * - Khatabook 1-Click WhatsApp Payment Reminders
 * - Mode Switcher: Campus Student ↔ Dukandaar POS
 * 
 * Developed by: Om Chauhan
 */

// Bestseller Campus Catalog
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
  activeTab: 'Store',
  currentUser: null,
  cart: {}, // { productId: qty }

  async init() {
    // Initialize sub-modules
    auth.init();
    payments.init();
    khata.init();
    inventory.init();
    notifications.init();

    // Mobile Notch Live Clock
    this.startMobileClock();

    // Mobile Bottom Navigation Bar (Thumb Zone)
    this.setupBottomNav();

    // Mode Switcher (Campus ↔ Dukandaar)
    this.setupModeSwitcher();

    // Campus Storefront & Cart
    this.renderCampusCatalog('all');
    this.setupCampusCart();

    // Dukandaar Tools & Soundbox
    this.setupDukandaarTools();

    // Bottom Sheets & Location Picker
    this.setupBottomSheets();

    // API Status Check
    this.checkApiStatus();

    // Check existing authentication
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

    // Default to Campus Mode
    this.switchPortalMode('campus');
  },

  startMobileClock() {
    const clockEl = document.getElementById('mobileClock');
    const update = () => {
      const now = new Date();
      const hrs = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      if (clockEl) clockEl.textContent = `${hrs}:${mins}`;
    };
    update();
    setInterval(update, 10000);
  },

  // =========================================================================
  // MOBILE BOTTOM NAVIGATION (THE THUMB ZONE)
  // =========================================================================

  setupBottomNav() {
    document.querySelectorAll('.mbn-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Topbar Brand click -> Go to Store
    const brandTrigger = document.getElementById('brandLogoTrigger');
    if (brandTrigger) {
      brandTrigger.addEventListener('click', () => this.switchTab('Store'));
    }

    // Topbar JWT Pill click -> Go to Account tab
    const topbarJwtPill = document.getElementById('topbarJwtPill');
    if (topbarJwtPill) {
      topbarJwtPill.addEventListener('click', () => this.switchTab('Account'));
    }

    // Hardware shortcut clicks from Dukandaar Store view
    const quickSoundbox = document.getElementById('quickSoundboxChip');
    if (quickSoundbox) {
      quickSoundbox.addEventListener('click', () => this.switchTab('Soundbox'));
    }

    const quickQrStand = document.getElementById('quickQrStandChip');
    if (quickQrStand) {
      quickQrStand.addEventListener('click', () => this.switchTab('Soundbox'));
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update Bottom Nav active state
    document.querySelectorAll('.mbn-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Hide all tab contents, show active
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    const targetContent = document.getElementById(`tabContent${tabName}`);
    if (targetContent) targetContent.style.display = 'flex';

    // Show/hide floating cart dock (only visible on Store tab in campus mode)
    const dock = document.getElementById('floatingCartDock');
    if (dock) {
      if (tabName === 'Store' && this.currentMode === 'campus' && this.getCartCount() > 0) {
        dock.style.display = 'flex';
      } else {
        dock.style.display = 'none';
      }
    }

    // Tab-specific data loading
    if (tabName === 'Khata') {
      this.loadKhataTabData();
    } else if (tabName === 'Payments') {
      this.loadPaymentsTabData();
    } else if (tabName === 'Account') {
      auth.renderJwtInspector();
    }
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
    const campusSec = document.getElementById('campusStoreSection');
    const dukandaarSec = document.getElementById('dukandaarPosSection');

    if (mode === 'campus') {
      if (btnCampus) btnCampus.classList.add('active');
      if (btnDukandaar) btnDukandaar.classList.remove('active');
      if (campusSec) campusSec.style.display = 'block';
      if (dukandaarSec) dukandaarSec.style.display = 'none';
      this.updateCartUI();
    } else {
      if (btnDukandaar) btnDukandaar.classList.add('active');
      if (btnCampus) btnCampus.classList.remove('active');
      if (dukandaarSec) dukandaarSec.style.display = 'block';
      if (campusSec) campusSec.style.display = 'none';
      // Hide cart dock
      const dock = document.getElementById('floatingCartDock');
      if (dock) dock.style.display = 'none';
      this.loadVyaparStats();
    }
  },

  // =========================================================================
  // CAMPUS STORE & CART (STUDENT PSYCHOLOGY)
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

    const countLabel = document.getElementById('productCountLabel');
    if (countLabel) countLabel.textContent = `(${items.length} Items)`;

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
    // Category scroll pills
    document.querySelectorAll('.m-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.m-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderCampusCatalog(pill.dataset.cat);
      });
    });

    // Trending tags
    document.querySelectorAll('.m-trend-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const q = tag.dataset.search;
        const input = document.getElementById('globalSearchInput');
        if (input) input.value = q;
        this.renderCampusCatalog('all', q);
      });
    });

    // Search input
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderCampusCatalog('all', e.target.value.trim());
      });
    }

    // Floating Cart Dock click -> Open Cart Bottom Sheet
    const dockCheckoutBtn = document.getElementById('dockCheckoutBtn');
    if (dockCheckoutBtn) {
      dockCheckoutBtn.addEventListener('click', () => this.openCartSheet());
    }

    const closeCartSheetBtn = document.getElementById('closeCartSheetBtn');
    if (closeCartSheetBtn) {
      closeCartSheetBtn.addEventListener('click', () => this.closeCartSheet());
    }

    // Pay UPI Button in Cart Sheet
    const payUpiBtn = document.getElementById('btnPayUpiCart');
    if (payUpiBtn) {
      payUpiBtn.addEventListener('click', async () => {
        const total = this.getCartTotal();
        if (total <= 0) return;

        try {
          this.showToast(`Initiating UPI payment of ₹${total}...`, 'info');
          
          // 1. Create Razorpay Payment Order
          const res = await api.post('/payments/order', {
            amount: total,
            description: 'Campus 10-Min Quick Order (DesiPay)',
          });

          // 2. Persist in ACID Quick Commerce Orders table
          const orderItems = Object.entries(this.cart).map(([id, qty]) => {
            const p = CAMPUS_CATALOG.find(item => item.id === id);
            return {
              productId: id,
              name: p ? p.name : id,
              quantity: qty,
              unitPrice: p ? p.price : 0,
              totalPrice: p ? p.price * qty : 0,
            };
          });

          await api.post('/orders', {
            items: orderItems,
            subtotal: total,
            deliveryFee: 0,
            discount: 0,
            totalAmount: total,
            deliveryLocation: document.getElementById('selectedLocationText')?.textContent?.trim() || 'North Campus Hostel Block 4',
            deliveryNote: 'Hostel quick doorstep delivery',
            estimatedMinutes: 8,
            paymentId: res.data?.paymentId,
          }).catch(err => console.warn('Order sync note:', err.message));

          this.closeCartSheet();
          this.cart = {};
          this.updateCartUI();
          this.renderCampusCatalog();

          this.showToast(`⚡ Order Placed! Est. Delivery: ~8 Mins`, 'success');

          // Trigger soundbox voice confirmation
          this.speakSoundbox(total);
        } catch (err) {
          this.showToast(err.message, 'error');
        }
      });
    }

    // Student Settle Khata button
    const settleKhataBtn = document.getElementById('settleKhataUpiBtn');
    if (settleKhataBtn) {
      settleKhataBtn.addEventListener('click', () => {
        document.getElementById('paymentSheetOverlay').style.display = 'flex';
        document.getElementById('payAmount').value = 180;
        document.getElementById('payDesc').value = 'Settling Sharma Ji Canteen Khata';
      });
    }

    // Split Bill Button
    const splitBillBtn = document.getElementById('splitBillBtn');
    if (splitBillBtn) {
      splitBillBtn.addEventListener('click', () => {
        const text = encodeURIComponent(
          "Bhai, Sharma Ji tuck shop ka canteen bill ₹180 baaki hai. Roommate split: ₹90 per person! UPI kar de: http://localhost:3001"
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    }
  },

  addToCart(productId) {
    this.cart[productId] = (this.cart[productId] || 0) + 1;
    this.updateCartUI();
    this.updateActionBox(productId);
    // Haptic feedback if on mobile
    if (navigator.vibrate) navigator.vibrate(30);
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
    if (navigator.vibrate) navigator.vibrate(20);
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

    const dock = document.getElementById('floatingCartDock');
    const dockCount = document.getElementById('dockCartCount');
    const dockTotal = document.getElementById('dockCartTotal');

    if (dock && this.activeTab === 'Store' && this.currentMode === 'campus') {
      if (count > 0) {
        dock.style.display = 'flex';
        if (dockCount) dockCount.textContent = count;
        if (dockTotal) dockTotal.textContent = `₹${total.toFixed(2)}`;
      } else {
        dock.style.display = 'none';
      }
    }
  },

  openCartSheet() {
    const overlay = document.getElementById('cartSheetOverlay');
    const list = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('billSubtotal');
    const grandTotalEl = document.getElementById('billGrandTotal');

    const total = this.getCartTotal();
    const items = Object.entries(this.cart).map(([id, qty]) => {
      const p = CAMPUS_CATALOG.find(item => item.id === id);
      return { ...p, qty };
    });

    if (items.length === 0) {
      list.innerHTML = '<div class="empty-state">Cart is empty.</div>';
    } else {
      list.innerHTML = items.map(item => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem;background:rgba(0,0,0,0.3);border-radius:8px">
          <div>
            <strong style="font-size:0.85rem">${item.name}</strong>
            <div style="font-size:0.72rem;color:var(--text-muted)">${item.pack} • ₹${item.price} each</div>
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

  closeCartSheet() {
    const overlay = document.getElementById('cartSheetOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  // =========================================================================
  // DUKANDAAR TOOLS & SOUNDBOX (KIRANA UNCLE PSYCHOLOGY)
  // =========================================================================

  setupDukandaarTools() {
    // Soundbox test button
    const testSoundboxBtn = document.getElementById('testSoundboxVoiceBtn');
    if (testSoundboxBtn) {
      testSoundboxBtn.addEventListener('click', () => {
        this.speakSoundbox(150);
      });
    }

    // Print Standee
    const printStandeeBtn = document.getElementById('printQrStandBtn');
    if (printStandeeBtn) {
      printStandeeBtn.addEventListener('click', () => window.print());
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

    // Giant Action Buttons: Payment In & Udhar Out
    const btnPayIn = document.getElementById('btnVyaparPaymentIn');
    if (btnPayIn) {
      btnPayIn.addEventListener('click', () => {
        document.getElementById('paymentSheetOverlay').style.display = 'flex';
      });
    }

    const btnUdharOut = document.getElementById('btnVyaparUdharOut');
    if (btnUdharOut) {
      btnUdharOut.addEventListener('click', () => {
        document.getElementById('khataSheetOverlay').style.display = 'flex';
      });
    }

    const createPayTabBtn = document.getElementById('createPaymentTabBtn');
    if (createPayTabBtn) {
      createPayTabBtn.addEventListener('click', () => {
        document.getElementById('paymentSheetOverlay').style.display = 'flex';
      });
    }

    const createKhataTabBtn = document.getElementById('createKhataTabBtn');
    if (createKhataTabBtn) {
      createKhataTabBtn.addEventListener('click', () => {
        document.getElementById('khataSheetOverlay').style.display = 'flex';
      });
    }
  },

  /**
   * Soundbox Voice Announcement:
   * Chime + Hindi Speech Synthesis
   */
  speakSoundbox(amount = 150) {
    this.showToast(`🔊 Soundbox: "देसीपे पर ₹${amount} प्राप्त हुए!"`, 'success');
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    // Asynchronously log to PostgreSQL soundbox_announcements table
    if (api.getToken()) {
      api.post('/voice/broadcast', { amount, language: 'hi-IN' }).catch(() => {});
    }

    // Audio chime
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

    // Hindi Voice
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `देसीपे पर ${amount} रुपये प्राप्त हुए! ${amount} Rupees received on DesiPay!`;
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.95;
        utter.pitch = 1.05;

        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => 
          v.lang.includes('hi') || v.lang.includes('IN') || v.name.includes('India') || v.name.includes('Hindi')
        );
        if (indianVoice) utter.voice = indianVoice;

        window.speechSynthesis.speak(utter);
      }
    }, 450);
  },

  async loadVyaparStats() {
    try {
      const res = await api.get('/khata/dashboard').catch(() => ({ data: {} }));
      const totalUdhar = res?.data?.totalOutstanding || 5420;
      const udharEl = document.getElementById('vyaparTotalUdhar');
      if (udharEl) udharEl.textContent = `₹${totalUdhar.toLocaleString('en-IN')}`;
    } catch {}
  },

  async loadKhataTabData() {
    const list = document.getElementById('vyaparDebtorsMobileList');
    if (!list) return;

    try {
      const res = await api.get('/khata/dashboard').catch(() => ({ data: {} }));
      const debtors = res?.data?.topDebtors || [
        { fullName: 'Rahul Verma (Student)', phone: '+919800000002', balance: 450.00, lastDate: 'Today' },
        { fullName: 'Aman Deep (Hostel 3)', phone: '+919800000003', balance: 320.00, lastDate: 'Yesterday' },
        { fullName: 'Priya Sharma (Hostel 2)', phone: '+919800000004', balance: 180.00, lastDate: '08 Sep' },
        { fullName: 'Vikram Singh (Canteen)', phone: '+919800000005', balance: 650.00, lastDate: '07 Sep' }
      ];

      list.innerHTML = debtors.map(d => {
        const phoneClean = (d.phone || '+919800000002').replace(/[^0-9]/g, '');
        const reminderText = encodeURIComponent(
          `Namaste ${d.fullName} ji! 🙏\n\nOm Kirana Store par aapka ₹${d.balance.toFixed(2)} ka udhar baaki hai.\nKripya is DesiPay UPI link se payment kar dijiye:\nhttp://localhost:3001\n\nDhanyawad!`
        );
        const waLink = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${reminderText}`;

        return `
          <div class="m-khata-card">
            <div class="mkc-info">
              <strong>${d.fullName}</strong>
              <small>${d.phone || 'Phone'} • ${d.lastDate || 'Recent'}</small>
            </div>
            <div class="mkc-right">
              <span class="mkc-amount">₹${d.balance.toFixed(2)}</span>
              <a href="${waLink}" target="_blank" class="btn-whatsapp-sm">
                <span>📲</span>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      list.innerHTML = '<div class="empty-state">No active debtors found.</div>';
    }
  },

  async loadPaymentsTabData() {
    const list = document.getElementById('paymentsMobileList');
    if (!list) return;

    try {
      const res = await api.get('/payments?limit=15').catch(() => ({ data: { payments: [] } }));
      const payments = res?.data?.payments || [];

      if (payments.length === 0) {
        list.innerHTML = '<div class="empty-state">No payment orders yet.</div>';
        return;
      }

      list.innerHTML = payments.map(p => `
        <div class="m-khata-card">
          <div class="mkc-info">
            <strong>₹${p.amount.toFixed(2)}</strong>
            <small>${new Date(p.createdAt).toLocaleDateString('en-IN')} • ${p.paymentMethod || 'UPI'}</small>
          </div>
          <div class="mkc-right">
            <span class="status status-${p.status.toLowerCase()}">${p.status}</span>
          </div>
        </div>
      `).join('');
    } catch {
      list.innerHTML = '<div class="empty-state">Failed to load payments.</div>';
    }
  },

  // =========================================================================
  // BOTTOM SHEETS & LOCATION
  // =========================================================================

  setupBottomSheets() {
    // Location Sheet
    const locBtn = document.getElementById('locationPickerBtn');
    const locSheet = document.getElementById('locationSheetOverlay');
    const closeLocBtn = document.getElementById('closeLocationSheetBtn');

    if (locBtn && locSheet) {
      locBtn.addEventListener('click', () => { locSheet.style.display = 'flex'; });
    }
    if (closeLocBtn && locSheet) {
      closeLocBtn.addEventListener('click', () => { locSheet.style.display = 'none'; });
    }

    document.querySelectorAll('.location-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.location-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const loc = item.dataset.loc;
        const textEl = document.getElementById('currentLocationText');
        if (textEl) textEl.textContent = `${loc} ▾`;
        if (locSheet) locSheet.style.display = 'none';
        this.showToast(`Location: ${loc}`, 'success');
      });
    });

    // Close on overlay backdrop tap
    document.querySelectorAll('.bottom-sheet-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    const closePaySheet = document.getElementById('closePaymentSheetBtn');
    if (closePaySheet) {
      closePaySheet.addEventListener('click', () => {
        document.getElementById('paymentSheetOverlay').style.display = 'none';
      });
    }

    const closeKhataSheet = document.getElementById('closeKhataSheetBtn');
    if (closeKhataSheet) {
      closeKhataSheet.addEventListener('click', () => {
        document.getElementById('khataSheetOverlay').style.display = 'none';
      });
    }
  },

  onLogin(user) {
    this.currentUser = user;
    this.updateAuthUI(user);

    if (user.role === 'SHOPKEEPER') {
      this.switchPortalMode('dukandaar');
      this.showToast(`Dukandaar Mode: ${user.fullName}`, 'success');
    } else {
      this.switchPortalMode('campus');
      this.showToast(`Campus Store: ${user.fullName}`, 'success');
    }

    this.switchTab('Store');
  },

  updateAuthUI(user) {
    const topbarJwtText = document.getElementById('topbarJwtText');
    const topbarPill = document.getElementById('topbarJwtPill');

    if (user && api.isAuthenticated()) {
      if (topbarJwtText) topbarJwtText.textContent = `JWT Active`;
      if (topbarPill) topbarPill.classList.remove('inactive');
    } else {
      if (topbarJwtText) topbarJwtText.textContent = `JWT Inactive`;
      if (topbarPill) topbarPill.classList.add('inactive');
    }
  },

  async checkApiStatus() {
    try {
      await fetch('http://localhost:3000/health');
    } catch {}
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
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  },
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => app.init());
