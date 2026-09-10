/**
 * DesiPay Symmetrical Kirana & Campus ERP Engine — Dual Persona Khata
 * ==================================================================
 * Perspective 1 (Student / Customer - Campus Mode):
 *   "मेरा दुकान खाता (My Dukan Udhar)"
 *   - Campus shops ledger (Om Kirana Store, Gupta Canteen, Sharma Xerox, Nescafe)
 *   - 1-Tap ⚡ Pay Shop UPI (Online settlement directly reducing shop debt)
 *   - 👥 Roommate Bill Splitter (Hostel per-head share calculation & WhatsApp request)
 *   - 📜 रसीद पासबुक (Itemized shop grocery bills, timestamps, audit trail)
 * 
 * Perspective 2 (Shopkeeper / Dukandaar - Vyapar Mode):
 *   "व्यापार खाता बही (Customer Accounts Receivable)"
 *   - Customer debtors list (Rahul Verma, Vikram Singh, Aman Deep, Priya Sharma, Rohit Mehra)
 *   - 🟢 जमा काटें (Record payment / vasooli from student)
 *   - + नया उधार (Issue credit / item purchase on udhar)
 *   - 📖 ग्राहक पासबुक (Individual customer ledger timeline)
 *   - 📲 WhatsApp तगादा (Payment reminders with payment links)
 *   - 4G Soundbox voice announcement on vasooli
 * 
 * Symmetrical Real-Time Synchronization:
 *   - Student Rahul Verma paying Om Kirana Store directly cuts Om Kirana's Accounts Receivable for Rahul Verma!
 *   - Dukandaar Om Kirana giving credit to Rahul Verma instantly updates Rahul Verma's student shop balance!
 * 
 * Developed by: Om Chauhan
 */

// 1. CAMPUS SHOPS DATASET (Customer / Student Perspective)
const DEFAULT_CAMPUS_SHOPS = [
  {
    id: 'shop-om',
    name: 'Om Kirana Store',
    owner: 'Om Chauhan (Counter 1)',
    category: 'Tuck Shop & Groceries',
    location: 'Campus Gate 2 / Tuck Shop Area',
    avatar: '🏪',
    phone: '+919800000001',
    upiVpa: 'omkirana@desipay',
    balance: 830,
    totalCredit: 1030,
    totalDebit: 200,
    entries: [
      {
        id: 's-ent-1',
        type: 'CREDIT',
        amount: 850,
        desc: '2x Fortune Oil + 1x Aashirvaad Atta on Udhar',
        balanceAfter: 850,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        paymentMethod: null
      },
      {
        id: 's-ent-2',
        type: 'CREDIT',
        amount: 180,
        desc: '2 Maggi Masala + 1 Red Bull Energy Drink',
        balanceAfter: 1030,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: null
      },
      {
        id: 's-ent-3',
        type: 'DEBIT',
        amount: 200,
        desc: 'PhonePe UPI Paid to Om Kirana (खाते से काटा गया)',
        balanceAfter: 830,
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        paymentMethod: 'UPI'
      }
    ]
  },
  {
    id: 'shop-gupta',
    name: 'Gupta Ji Canteen & Mess',
    owner: 'Ramesh Gupta',
    category: 'Mess & Quick Canteen',
    location: 'Near Central Library & Lawn',
    avatar: '🍜',
    phone: '+919876543220',
    upiVpa: 'guptacanteen@upi',
    balance: 180,
    totalCredit: 350,
    totalDebit: 170,
    entries: [
      {
        id: 's-ent-g1',
        type: 'CREDIT',
        amount: 170,
        desc: '3x Cold Coffee + 2x Grilled Cheese Sandwich',
        balanceAfter: 170,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        paymentMethod: null
      },
      {
        id: 's-ent-g2',
        type: 'DEBIT',
        amount: 170,
        desc: 'GPay UPI Paid in full',
        balanceAfter: 0,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMethod: 'UPI'
      },
      {
        id: 's-ent-g3',
        type: 'CREDIT',
        amount: 180,
        desc: '4x Aloo Paratha + Special Masala Chai (Night Canteen)',
        balanceAfter: 180,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: null
      }
    ]
  },
  {
    id: 'shop-sharma',
    name: 'Sharma Xerox & Stationery',
    owner: 'Suresh Sharma',
    category: 'Print, Spiral & Books',
    location: 'Academic Block Ground Floor',
    avatar: '📚',
    phone: '+919876543221',
    upiVpa: 'sharma_xerox@okaxis',
    balance: 65,
    totalCredit: 165,
    totalDebit: 100,
    entries: [
      {
        id: 's-ent-s1',
        type: 'CREDIT',
        amount: 165,
        desc: '45 Pages Color Assignment Print + 1 Spiral Notebook',
        balanceAfter: 165,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMethod: null
      },
      {
        id: 's-ent-s2',
        type: 'DEBIT',
        amount: 100,
        desc: 'Cash Paid to Sharma ji',
        balanceAfter: 65,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: 'CASH'
      }
    ]
  },
  {
    id: 'shop-nescafe',
    name: 'Nescafe Campus Kiosk',
    owner: 'Sunil Kumar',
    category: 'Coffee, Frappe & Snacks',
    location: 'Hostel Quadrangle',
    avatar: '☕',
    phone: '+919876543222',
    upiVpa: 'nescafe_campus@paytm',
    balance: 0,
    totalCredit: 240,
    totalDebit: 240,
    entries: [
      {
        id: 's-ent-n1',
        type: 'CREDIT',
        amount: 240,
        desc: '2x Hazelnut Frappe + 1x Walnut Brownie',
        balanceAfter: 240,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        paymentMethod: null
      },
      {
        id: 's-ent-n2',
        type: 'DEBIT',
        amount: 240,
        desc: 'Full settlement via Paytm UPI QR',
        balanceAfter: 0,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMethod: 'UPI'
      }
    ]
  }
];

// 2. SHOPKEEPER CUSTOMER DEBTORS DATASET (Dukandaar Perspective)
const DEFAULT_KHATA_CUSTOMERS = [
  {
    id: 'c276e6bf-42a6-4432-8f6c-d2e500ecb7c9',
    fullName: 'Rahul Verma',
    phone: '+919800000002',
    address: 'Hostel 4, Room 102',
    balance: 830,
    totalCredit: 1030,
    totalDebit: 200,
    entries: [
      {
        id: 'ent-rv-1',
        type: 'CREDIT',
        amount: 850,
        desc: '2x Fortune Oil + 1x Aashirvaad Atta on Udhar',
        balanceAfter: 850,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-rv-2',
        type: 'CREDIT',
        amount: 180,
        desc: '2 Maggi Masala + 1 Red Bull Energy Drink',
        balanceAfter: 1030,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-rv-3',
        type: 'DEBIT',
        amount: 200,
        desc: 'PhonePe UPI Vasooli (खाते से काटा गया)',
        balanceAfter: 830,
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        paymentMethod: 'UPI'
      }
    ]
  },
  {
    id: '0371b8de-9073-4a1a-b2d2-70d8b811a99c',
    fullName: 'Vikram Singh',
    phone: '+919800000005',
    address: 'Campus Canteen Staff',
    balance: 600,
    totalCredit: 1100,
    totalDebit: 500,
    entries: [
      {
        id: 'ent-vs-1',
        type: 'CREDIT',
        amount: 650,
        desc: 'Bulk Tea Leaves, Sugar & Parle-G Biscuit boxes',
        balanceAfter: 650,
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-vs-2',
        type: 'CREDIT',
        amount: 450,
        desc: 'Cold drinks crate (Sting & Red Bull)',
        balanceAfter: 1100,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-vs-3',
        type: 'DEBIT',
        amount: 500,
        desc: 'Cash Payment received (गल्ले में जमा)',
        balanceAfter: 600,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: 'CASH'
      }
    ]
  },
  {
    id: 'e3a1d364-9521-4e02-b01e-9055889dba9d',
    fullName: 'Aman Deep',
    phone: '+919800000003',
    address: 'Boys Hostel 3, Room 214',
    balance: 270,
    totalCredit: 470,
    totalDebit: 200,
    entries: [
      {
        id: 'ent-ad-1',
        type: 'CREDIT',
        amount: 320,
        desc: '3 Sting Energy + 2 Lays Magic Masala Party Pack',
        balanceAfter: 320,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-ad-2',
        type: 'CREDIT',
        amount: 150,
        desc: 'Classmate Spiral Notebook + 2 Blue Gel Pens',
        balanceAfter: 470,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-ad-3',
        type: 'DEBIT',
        amount: 200,
        desc: 'GPay UPI Settlement (आंशिक भुगतान)',
        balanceAfter: 270,
        date: new Date(Date.now() - 3600000 * 6).toISOString(),
        paymentMethod: 'UPI'
      }
    ]
  },
  {
    id: 'c9527994-904f-444b-9468-9ac682002262',
    fullName: 'Priya Sharma',
    phone: '+919800000004',
    address: 'Girls Hostel 2, Room 405',
    balance: 0,
    totalCredit: 180,
    totalDebit: 180,
    entries: [
      {
        id: 'ent-ps-1',
        type: 'CREDIT',
        amount: 180,
        desc: '2 Amul Taaza Milk + Brown Bread',
        balanceAfter: 180,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        paymentMethod: null
      },
      {
        id: 'ent-ps-2',
        type: 'DEBIT',
        amount: 180,
        desc: 'Full settlement via Paytm QR (हिसाब चुकता)',
        balanceAfter: 0,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: 'UPI'
      }
    ]
  },
  {
    id: '0178dd96-9499-43e4-9d20-8bc2dbf8b732',
    fullName: 'Rohit Mehra',
    phone: '+919800000006',
    address: 'Faculty Block B, Flat 12',
    balance: 240,
    totalCredit: 240,
    totalDebit: 0,
    entries: [
      {
        id: 'ent-rm-1',
        type: 'CREDIT',
        amount: 240,
        desc: '4x Maggi Masala Noodles + 1x Dairy Milk Silk',
        balanceAfter: 240,
        date: new Date(Date.now() - 86400000).toISOString(),
        paymentMethod: null
      }
    ]
  }
];

// Roommates list for hostel bill splitting
const DEFAULT_ROOMMATES = [
  { name: 'Rahul Verma (You)', phone: '+919800000002', role: 'You' },
  { name: 'Aman Deep', phone: '+919800000003', role: 'Roommate' },
  { name: 'Vikram Singh', phone: '+919800000005', role: 'Wingmate' },
  { name: 'Rohit Mehra', phone: '+919800000006', role: 'Roommate' },
  { name: 'Sameer Khan', phone: '+919876500010', role: 'Friend' }
];

const khata = {
  currentMode: 'campus', // 'campus' | 'dukandaar'
  shops: [],
  customers: [],

  // Student persona filters
  studentFilter: 'all', // 'all' | 'pending' | 'settled'
  studentSearchQuery: '',
  selectedShopId: null,

  // Dukandaar persona filters
  activeFilter: 'all', // 'all' | 'pending' | 'settled'
  searchQuery: '',
  selectedCustomerId: null,

  // Split with Roommates state
  splitState: {
    shopId: 'shop-om',
    totalBill: 180,
    peopleCount: 3,
    roommates: DEFAULT_ROOMMATES.slice(0, 3)
  },

  init() {
    this.loadInitialData();
    this.bindEvents();
    this.onModeSwitch('campus');
  },

  loadInitialData() {
    let hasCustomers = false;
    let hasShops = false;

    try {
      const storedCustomers = localStorage.getItem('desipay_khata_customers_v3');
      if (storedCustomers && storedCustomers !== '[]') {
        const parsed = JSON.parse(storedCustomers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.customers = parsed;
          hasCustomers = true;
        }
      }
    } catch {}

    if (!hasCustomers) {
      this.customers = JSON.parse(JSON.stringify(DEFAULT_KHATA_CUSTOMERS));
    }

    try {
      const storedShops = localStorage.getItem('desipay_khata_shops_v3');
      if (storedShops && storedShops !== '[]') {
        const parsed = JSON.parse(storedShops);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.shops = parsed;
          hasShops = true;
        }
      }
    } catch {}

    if (!hasShops) {
      this.shops = JSON.parse(JSON.stringify(DEFAULT_CAMPUS_SHOPS));
    }

    this.saveData();
  },

  saveData() {
    try {
      localStorage.setItem('desipay_khata_customers_v3', JSON.stringify(this.customers));
      localStorage.setItem('desipay_khata_shops_v3', JSON.stringify(this.shops));
    } catch {}
  },

  /**
   * Mode switcher hook called whenever user toggles between Student and Dukandaar
   */
  onModeSwitch(mode) {
    this.currentMode = mode;

    const studentSec = document.getElementById('customerKhataSection');
    const vyaparSec = document.getElementById('vyaparKhataSection');

    if (mode === 'campus') {
      if (studentSec) studentSec.style.display = 'block';
      if (vyaparSec) vyaparSec.style.display = 'none';
      this.renderStudentShopList();
      this.updateStudentMetrics();
    } else {
      if (vyaparSec) vyaparSec.style.display = 'block';
      if (studentSec) studentSec.style.display = 'none';
      this.renderCustomerList();
      this.updateDukandaarMetrics();
    }

    // Synchronize Tab 1 student banner
    this.updateTab1Banner();
  },

  updateTab1Banner() {
    const omShop = this.shops.find(s => s.id === 'shop-om');
    const balEl = document.getElementById('studentKhataAmount');
    const badgeEl = document.getElementById('studentKhataStatusBadge');

    if (omShop && balEl) {
      balEl.textContent = `₹${omShop.balance.toFixed(2)}`;
      if (badgeEl) {
        if (omShop.balance === 0) {
          badgeEl.textContent = 'Settled';
          badgeEl.style.background = '#dcfce7';
          badgeEl.style.color = '#0c831f';
        } else {
          badgeEl.textContent = 'Pending';
          badgeEl.style.background = '#fee2e2';
          badgeEl.style.color = '#dc2626';
        }
      }
    }
  },

  getShopBalance(shopId) {
    const shop = this.shops.find(s => s.id === shopId);
    return shop ? shop.balance : 0;
  },

  bindEvents() {
    // =======================================================================
    // 1. STUDENT PERSONA EVENTS
    // =======================================================================

    // Student Shop Search
    const studentSearch = document.getElementById('studentKhataSearchInput');
    if (studentSearch) {
      studentSearch.addEventListener('input', (e) => {
        this.studentSearchQuery = e.target.value.trim().toLowerCase();
        this.renderStudentShopList();
      });
    }

    // Student Shop Filter Pills
    document.querySelectorAll('#studentKhataFilterPills .m-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#studentKhataFilterPills .m-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.studentFilter = pill.dataset.filter || 'all';
        this.renderStudentShopList();
      });
    });

    // Student Pay All UPI Header Button
    const btnPayAll = document.getElementById('btnStudentPayAllUpi');
    if (btnPayAll) {
      btnPayAll.addEventListener('click', () => {
        this.openStudentPayModal('shop-om');
      });
    }

    // Student Split Expenses Header Button
    const btnSplitAll = document.getElementById('btnStudentSplitExpenses');
    if (btnSplitAll) {
      btnSplitAll.addEventListener('click', () => {
        this.openRoommateSplitModal('shop-om');
      });
    }

    // Tab 1 Banner Buttons
    const settleKhataBtn = document.getElementById('settleKhataUpiBtn');
    if (settleKhataBtn) {
      settleKhataBtn.addEventListener('click', () => {
        this.openStudentPayModal('shop-om');
      });
    }

    const splitBillBtn = document.getElementById('splitBillBtn');
    if (splitBillBtn) {
      splitBillBtn.addEventListener('click', () => {
        this.openRoommateSplitModal('shop-om');
      });
    }

    // =======================================================================
    // 2. DUKANDAAR PERSONA EVENTS
    // =======================================================================

    // Dukandaar Customer Search
    const dukandaarSearch = document.getElementById('khataSearchInput');
    if (dukandaarSearch) {
      dukandaarSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderCustomerList();
      });
    }

    // Dukandaar Filter Pills
    document.querySelectorAll('#khataFilterPills .m-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#khataFilterPills .m-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.dataset.filter || 'all';
        this.renderCustomerList();
      });
    });

    // New Entry Modal Trigger
    const triggerBtn = document.getElementById('createKhataTabBtn');
    const khataSheet = document.getElementById('khataSheetOverlay');
    if (triggerBtn && khataSheet) {
      triggerBtn.addEventListener('click', () => {
        this.populateCustomerChipsInModal();
        khataSheet.style.display = 'flex';
      });
    }

    const closeKhataSheetBtn = document.getElementById('closeKhataSheetBtn');
    if (closeKhataSheetBtn && khataSheet) {
      closeKhataSheetBtn.addEventListener('click', () => {
        khataSheet.style.display = 'none';
      });
    }

    // Add New Customer Modal
    const addCustBtn = document.getElementById('btnAddNewCustomer');
    const newCustModal = document.getElementById('newCustomerModal');
    const closeNewCustBtn = document.getElementById('closeNewCustomerBtn');

    if (addCustBtn && newCustModal) {
      addCustBtn.addEventListener('click', () => {
        newCustModal.style.display = 'flex';
      });
    }
    if (closeNewCustBtn && newCustModal) {
      closeNewCustBtn.addEventListener('click', () => {
        newCustModal.style.display = 'none';
      });
    }

    // Add New Customer Form Submit
    const newCustForm = document.getElementById('newCustomerForm');
    if (newCustForm) {
      newCustForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('ncFullName')?.value.trim();
        const phone = document.getElementById('ncPhone')?.value.trim();
        const address = document.getElementById('ncAddress')?.value.trim() || 'Hostel Campus';
        const openingUdhar = parseFloat(document.getElementById('ncOpeningBalance')?.value || '0');

        if (!fullName || !phone) return;

        const newId = 'cust-' + Date.now();
        const newCustomer = {
          id: newId,
          fullName,
          phone,
          address,
          balance: openingUdhar,
          totalCredit: openingUdhar,
          totalDebit: 0,
          entries: openingUdhar > 0 ? [
            {
              id: 'ent-' + Date.now(),
              type: 'CREDIT',
              amount: openingUdhar,
              desc: 'आरंभिक उधारी (Opening Udhar Balance)',
              balanceAfter: openingUdhar,
              date: new Date().toISOString(),
              paymentMethod: null
            }
          ] : []
        };

        this.customers.unshift(newCustomer);
        this.saveData();

        if (newCustModal) newCustModal.style.display = 'none';
        newCustForm.reset();

        app.showToast(`नया ग्राहक जोड़ा गया: ${fullName}`, 'success');
        this.renderCustomerList();
        this.updateDukandaarMetrics();
        this.openPassbook(newId);
      });
    }

    // =======================================================================
    // 3. PASSBOOK & SETTLEMENT MODALS (DUKANDAAR)
    // =======================================================================

    const closePassbookBtn = document.getElementById('closePassbookSheetBtn');
    const passbookSheet = document.getElementById('customerPassbookSheetOverlay');
    if (closePassbookBtn && passbookSheet) {
      closePassbookBtn.addEventListener('click', () => {
        passbookSheet.style.display = 'none';
      });
    }

    const cpbSettleBtn = document.getElementById('cpbSettleBtn');
    if (cpbSettleBtn) {
      cpbSettleBtn.addEventListener('click', () => {
        if (this.selectedCustomerId) this.openSettleModal(this.selectedCustomerId);
      });
    }

    const cpbAddCreditBtn = document.getElementById('cpbAddCreditBtn');
    if (cpbAddCreditBtn) {
      cpbAddCreditBtn.addEventListener('click', () => {
        if (this.selectedCustomerId) this.openAddCreditModal(this.selectedCustomerId);
      });
    }

    const cpbWhatsAppBtn = document.getElementById('cpbWhatsAppBtn');
    if (cpbWhatsAppBtn) {
      cpbWhatsAppBtn.addEventListener('click', () => {
        if (this.selectedCustomerId) this.sendWhatsAppStatement(this.selectedCustomerId);
      });
    }

    const closeSettleBtn = document.getElementById('closeCustomerSettleBtn');
    const settleModal = document.getElementById('customerSettleModal');
    if (closeSettleBtn && settleModal) {
      closeSettleBtn.addEventListener('click', () => {
        settleModal.style.display = 'none';
      });
    }

    // Dukandaar Settle Amount Chips
    document.querySelectorAll('.csm-amt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.csm-amt-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cust = this.customers.find(c => c.id === this.selectedCustomerId);
        const amtInput = document.getElementById('csmAmount');
        if (!amtInput || !cust) return;

        if (chip.id === 'csmFullAmtChip') {
          amtInput.value = cust.balance > 0 ? cust.balance.toFixed(2) : '0';
        } else {
          amtInput.value = chip.dataset.val;
        }
      });
    });

    const fullSettleQuickBtn = document.getElementById('csmFullSettleChip');
    if (fullSettleQuickBtn) {
      fullSettleQuickBtn.addEventListener('click', () => {
        const cust = this.customers.find(c => c.id === this.selectedCustomerId);
        const amtInput = document.getElementById('csmAmount');
        if (amtInput && cust) amtInput.value = cust.balance > 0 ? cust.balance.toFixed(2) : '0';
      });
    }

    // Dukandaar Settle Form Submit (Cut from Customer Balance)
    const settleForm = document.getElementById('customerSettleForm');
    if (settleForm) {
      settleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('csmError');
        if (errEl) errEl.textContent = '';

        const cust = this.customers.find(c => c.id === this.selectedCustomerId);
        if (!cust) return;

        const settleAmount = parseFloat(document.getElementById('csmAmount')?.value || '0');
        const paymentMode = document.getElementById('csmPaymentMode')?.value || 'UPI';
        const notes = document.getElementById('csmNotes')?.value.trim() || `Settlement via ${paymentMode}`;

        if (settleAmount <= 0) {
          if (errEl) errEl.textContent = 'Please enter a valid positive settlement amount.';
          return;
        }

        // Try backend settle API call
        try {
          if (window.api?.isAuthenticated?.()) {
            await window.api.post('/khata/settle', {
              customerId: cust.id,
              amount: settleAmount,
              paymentMethod: paymentMode,
              description: notes,
            }).catch(() => {});
          }
        } catch {}

        // Reduce Dukandaar customer balance
        cust.balance = Math.max(0, cust.balance - settleAmount);
        cust.totalDebit += settleAmount;

        const newEntry = {
          id: 'ent-' + Date.now(),
          type: 'DEBIT',
          amount: settleAmount,
          desc: notes,
          balanceAfter: cust.balance,
          date: new Date().toISOString(),
          paymentMethod: paymentMode
        };
        cust.entries.unshift(newEntry);

        // Symmetrical Double Entry: If customer is Rahul Verma, update Om Kirana Store shop in student view
        if (cust.fullName.toLowerCase().includes('rahul')) {
          const omShop = this.shops.find(s => s.id === 'shop-om');
          if (omShop) {
            omShop.balance = Math.max(0, omShop.balance - settleAmount);
            omShop.totalDebit += settleAmount;
            omShop.entries.unshift({
              id: 's-ent-' + Date.now(),
              type: 'DEBIT',
              amount: settleAmount,
              desc: `Dukandaar Jama Kata (${paymentMode}): ${notes}`,
              balanceAfter: omShop.balance,
              date: new Date().toISOString(),
              paymentMethod: paymentMode
            });
          }
        }

        this.saveData();

        if (settleModal) settleModal.style.display = 'none';
        settleForm.reset();

        app.showToast(`✅ ₹${settleAmount} ${cust.fullName} के खाते से काट दिया गया!`, 'success');
        if (app.speakSoundbox) {
          app.speakSoundbox(settleAmount);
        }

        this.renderCustomerList();
        this.updateDukandaarMetrics();
        this.updateTab1Banner();
        this.openPassbook(cust.id);
      });
    }

    // =======================================================================
    // 4. STUDENT PAY SHOP MODAL & LOGIC
    // =======================================================================

    const closeStudentPayBtn = document.getElementById('closeStudentPayShopBtn');
    const studentPayModal = document.getElementById('studentPayShopModal');
    if (closeStudentPayBtn && studentPayModal) {
      closeStudentPayBtn.addEventListener('click', () => {
        studentPayModal.style.display = 'none';
      });
    }

    // Student pay amount quick chips
    document.querySelectorAll('.spsm-amt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.spsm-amt-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const shop = this.shops.find(s => s.id === this.selectedShopId);
        const amtInput = document.getElementById('spsmAmount');
        if (!amtInput || !shop) return;

        if (chip.id === 'spsmFullAmtChip') {
          amtInput.value = shop.balance > 0 ? shop.balance.toFixed(2) : '0';
        } else {
          amtInput.value = chip.dataset.val;
        }
      });
    });

    // Student Pay Shop Form Submit
    const studentPayForm = document.getElementById('studentPayShopForm');
    if (studentPayForm) {
      studentPayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('spsmError');
        if (errEl) errEl.textContent = '';

        const shop = this.shops.find(s => s.id === this.selectedShopId);
        if (!shop) return;

        const payAmount = parseFloat(document.getElementById('spsmAmount')?.value || '0');
        const payMethod = document.getElementById('spsmAppSelect')?.value || 'UPI_PHONEPE';
        const note = document.getElementById('spsmNotes')?.value.trim() || 'Student UPI Payment';

        if (payAmount <= 0) {
          if (errEl) errEl.textContent = 'Please enter a valid amount.';
          return;
        }

        // Process student payment with symmetrical ERP sync
        this.processStudentShopPayment(shop.id, payAmount, payMethod, note);

        if (studentPayModal) studentPayModal.style.display = 'none';
        studentPayForm.reset();
      });
    }

    // =======================================================================
    // 5. ROOMMATE SPLIT MODAL & LOGIC
    // =======================================================================

    const closeSplitBtn = document.getElementById('closeRoommateSplitBtn');
    const splitModal = document.getElementById('roommateSplitModal');
    if (closeSplitBtn && splitModal) {
      closeSplitBtn.addEventListener('click', () => {
        splitModal.style.display = 'none';
      });
    }

    const btnRsmIncr = document.getElementById('btnRsmIncr');
    const btnRsmDecr = document.getElementById('btnRsmDecr');

    if (btnRsmIncr) {
      btnRsmIncr.addEventListener('click', () => {
        if (this.splitState.peopleCount < 6) {
          this.splitState.peopleCount++;
          this.updateSplitModalUI();
        }
      });
    }

    if (btnRsmDecr) {
      btnRsmDecr.addEventListener('click', () => {
        if (this.splitState.peopleCount > 2) {
          this.splitState.peopleCount--;
          this.updateSplitModalUI();
        }
      });
    }

    // WhatsApp Share Split Request
    const btnShareSplitWhatsApp = document.getElementById('btnShareSplitWhatsApp');
    if (btnShareSplitWhatsApp) {
      btnShareSplitWhatsApp.addEventListener('click', () => {
        this.shareSplitOnWhatsApp();
      });
    }

    // Mark Split Collected
    const btnMarkCollected = document.getElementById('btnMarkSplitCollected');
    if (btnMarkCollected) {
      btnMarkCollected.addEventListener('click', () => {
        app.showToast('✅ सभी रूममेट्स का हिस्सा प्राप्त हो गया! हिसाब चुकता।', 'success');
        if (splitModal) splitModal.style.display = 'none';
      });
    }

    // =======================================================================
    // 6. SHOP PASSBOOK MODAL (STUDENT VIEW)
    // =======================================================================

    const closeShopPassbookBtn = document.getElementById('closeShopPassbookBtn');
    const shopPassbookOverlay = document.getElementById('shopPassbookSheetOverlay');
    if (closeShopPassbookBtn && shopPassbookOverlay) {
      closeShopPassbookBtn.addEventListener('click', () => {
        shopPassbookOverlay.style.display = 'none';
      });
    }

    const spbPayShopBtn = document.getElementById('spbPayShopBtn');
    if (spbPayShopBtn) {
      spbPayShopBtn.addEventListener('click', () => {
        if (this.selectedShopId) {
          shopPassbookOverlay.style.display = 'none';
          this.openStudentPayModal(this.selectedShopId);
        }
      });
    }

    const spbSplitBtn = document.getElementById('spbSplitBtn');
    if (spbSplitBtn) {
      spbSplitBtn.addEventListener('click', () => {
        if (this.selectedShopId) {
          shopPassbookOverlay.style.display = 'none';
          this.openRoommateSplitModal(this.selectedShopId);
        }
      });
    }

    // General Entry Form (Sheet 4)
    const form = document.getElementById('createKhataForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('khataError');
        if (errEl) errEl.textContent = '';

        try {
          const customerId = document.getElementById('khataCustomerId')?.value.trim();
          const selectedRadio = document.querySelector('input[name="khataTypeRadio"]:checked');
          const entryType = selectedRadio ? selectedRadio.value : (document.getElementById('khataType')?.value || 'CREDIT');
          const amount = parseFloat(document.getElementById('khataAmount')?.value || '0');
          const desc = document.getElementById('khataDesc')?.value || (entryType === 'CREDIT' ? 'Kirana Items Udhar' : 'Payment Received');

          if (amount <= 0) {
            if (errEl) errEl.textContent = 'Please enter an amount greater than 0';
            return;
          }

          let cust = this.customers.find(c => c.id === customerId);
          if (!cust) {
            const customerNameInput = document.getElementById('khataCustomerId')?.value.trim() || 'Campus Customer';
            cust = this.customers.find(c => c.fullName.toLowerCase() === customerNameInput.toLowerCase());
            if (!cust) {
              cust = {
                id: 'cust-' + Date.now(),
                fullName: customerNameInput,
                phone: '+9198' + Math.floor(10000000 + Math.random() * 90000000),
                address: 'Hostel Block',
                balance: 0,
                totalCredit: 0,
                totalDebit: 0,
                entries: []
              };
              this.customers.unshift(cust);
            }
          }

          // Apply Entry
          if (entryType === 'CREDIT') {
            cust.balance += amount;
            cust.totalCredit += amount;
          } else {
            cust.balance = Math.max(0, cust.balance - amount);
            cust.totalDebit += amount;
          }

          cust.entries.unshift({
            id: 'ent-' + Date.now(),
            type: entryType,
            amount: amount,
            desc: desc,
            balanceAfter: cust.balance,
            date: new Date().toISOString(),
            paymentMethod: entryType === 'DEBIT' ? 'UPI' : null
          });

          // Bi-directional Symmetrical sync with student shop view
          if (cust.fullName.toLowerCase().includes('rahul')) {
            const omShop = this.shops.find(s => s.id === 'shop-om');
            if (omShop) {
              if (entryType === 'CREDIT') {
                omShop.balance += amount;
                omShop.totalCredit += amount;
              } else {
                omShop.balance = Math.max(0, omShop.balance - amount);
                omShop.totalDebit += amount;
              }
              omShop.entries.unshift({
                id: 's-ent-' + Date.now(),
                type: entryType,
                amount: amount,
                desc: desc,
                balanceAfter: omShop.balance,
                date: new Date().toISOString(),
                paymentMethod: entryType === 'DEBIT' ? 'UPI' : null
              });
            }
          }

          this.saveData();

          if (khataSheet) khataSheet.style.display = 'none';
          form.reset();

          app.showToast(`खाता एंट्री दर्ज: ${entryType === 'CREDIT' ? '🔴 उधार दिया' : '🟢 पैसा मिला'}: ₹${amount} (${cust.fullName})`, 'success');

          if (entryType === 'DEBIT' && app.speakSoundbox) {
            app.speakSoundbox(amount);
          }

          this.renderCustomerList();
          this.updateDukandaarMetrics();
          this.updateTab1Banner();
        } catch (error) {
          if (errEl) errEl.textContent = error.message;
          app.showToast(error.message, 'error');
        }
      });
    }
  },

  /**
   * Real-time Symmetrical ERP Transaction Engine:
   * Student Rahul Verma pays shopkeeper via UPI -> Cuts student's shop debt + Dukandaar's accounts receivable
   */
  processStudentShopPayment(shopId, amount, paymentMethod, note) {
    const shop = this.shops.find(s => s.id === shopId);
    if (!shop) return;

    // 1. Cut from student shop balance
    shop.balance = Math.max(0, shop.balance - amount);
    shop.totalDebit += amount;

    const studentEntry = {
      id: 's-ent-' + Date.now(),
      type: 'DEBIT',
      amount: amount,
      desc: `⚡ ${paymentMethod.replace('_', ' ')}: ${note || 'Paid to Shop'}`,
      balanceAfter: shop.balance,
      date: new Date().toISOString(),
      paymentMethod: paymentMethod
    };
    shop.entries.unshift(studentEntry);

    // 2. Symmetrical Linking: If shop is Om Kirana Store, update Dukandaar Om Kirana's customer Rahul Verma!
    if (shopId === 'shop-om') {
      const rahulCust = this.customers.find(c => c.id === 'c276e6bf-42a6-4432-8f6c-d2e500ecb7c9' || c.fullName.toLowerCase().includes('rahul'));
      if (rahulCust) {
        rahulCust.balance = Math.max(0, rahulCust.balance - amount);
        rahulCust.totalDebit += amount;
        rahulCust.entries.unshift({
          id: 'ent-' + Date.now(),
          type: 'DEBIT',
          amount: amount,
          desc: `Online UPI Settlement by Rahul Verma (${paymentMethod})`,
          balanceAfter: rahulCust.balance,
          date: new Date().toISOString(),
          paymentMethod: 'UPI'
        });

        // Try backend settle API call
        if (window.api?.isAuthenticated?.()) {
          window.api.post('/khata/settle', {
            customerId: rahulCust.id,
            amount: amount,
            paymentMethod: 'UPI',
            description: `Online UPI Vasooli from Rahul Verma (${paymentMethod})`
          }).catch(() => {});
        }
      }
    }

    this.saveData();

    // 3. Audio Chime + 4G Soundbox Announcement
    if (app.speakSoundbox) {
      app.speakSoundbox(amount, 'hi-IN');
    }

    // 4. Toast notification
    app.showToast(`✅ ₹${amount} ${shop.name} को सफलता पूर्वक चुकाए गए!`, 'success');

    // 5. Update UI
    this.renderStudentShopList();
    this.updateStudentMetrics();
    this.renderCustomerList();
    this.updateDukandaarMetrics();
    this.updateTab1Banner();
  },

  // =========================================================================
  // STUDENT VIEW: RENDER CAMPUS SHOPS
  // =========================================================================

  renderStudentShopList() {
    const list = document.getElementById('studentShopsMobileList');
    if (!list) return;

    let filtered = this.shops;

    if (this.studentFilter === 'pending') {
      filtered = filtered.filter(s => s.balance > 0);
    } else if (this.studentFilter === 'settled') {
      filtered = filtered.filter(s => s.balance === 0);
    }

    if (this.studentSearchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(this.studentSearchQuery) ||
        s.owner.toLowerCase().includes(this.studentSearchQuery) ||
        s.category.toLowerCase().includes(this.studentSearchQuery) ||
        s.location.toLowerCase().includes(this.studentSearchQuery)
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div style="background:#ffffff;border:1px solid var(--border-light);border-radius:14px;padding:2rem 1rem;text-align:center;box-shadow:var(--shadow-sm)">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">🏪</div>
          <strong style="display:block;font-size:0.95rem;color:var(--text-primary)">कोई दुकान नहीं मिली</strong>
          <small style="color:var(--text-muted);font-size:0.75rem">दुकान का नाम या श्रेणी बदलकर खोजें।</small>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(shop => {
      const isSettled = shop.balance === 0;
      const lastEntry = shop.entries && shop.entries.length > 0 ? shop.entries[0] : null;

      let lastEntryText = 'No purchases recorded';
      if (lastEntry) {
        const timeAgo = this.formatDate(lastEntry.date);
        if (lastEntry.type === 'CREDIT') {
          lastEntryText = `<span style="color:#dc2626;font-weight:700">🔴 +₹${lastEntry.amount} उधार</span> (${lastEntry.desc}) • ${timeAgo}`;
        } else {
          lastEntryText = `<span style="color:#0c831f;font-weight:700">🟢 -₹${lastEntry.amount} चुकाया</span> (${lastEntry.desc}) • ${timeAgo}`;
        }
      }

      return `
        <div class="m-khata-card" style="display:flex;flex-direction:column;gap:0.75rem;padding:0.9rem 1rem;background:#ffffff;border:1px solid var(--border-light);border-radius:14px;box-shadow:var(--shadow-card)">
          
          <!-- Shop Header Row -->
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.65rem">
              <div style="width:40px;height:40px;border-radius:12px;background:${isSettled ? '#dcfce7' : '#eff6ff'};color:${isSettled ? '#0c831f' : '#1e40af'};display:flex;align-items:center;justify-content:center;font-size:1.3rem;border:1px solid ${isSettled ? '#86efac' : '#bfdbfe'}">
                ${shop.avatar || '🏪'}
              </div>
              <div>
                <strong style="font-size:0.92rem;color:var(--text-primary);display:block;line-height:1.2">${shop.name}</strong>
                <small style="color:var(--text-secondary);font-size:0.7rem">${shop.location} • ${shop.owner}</small>
              </div>
            </div>

            <div style="text-align:right">
              <div style="font-family:var(--font-heading);font-size:1.2rem;font-weight:900;color:${isSettled ? '#0c831f' : '#dc2626'}">
                ${isSettled ? '₹0.00' : '₹' + shop.balance.toFixed(2)}
              </div>
              <span style="font-size:0.62rem;font-weight:800;padding:2px 6px;border-radius:8px;background:${isSettled ? '#dcfce7' : '#fee2e2'};color:${isSettled ? '#0c831f' : '#dc2626'}">
                ${isSettled ? '🟢 हिसाब चुकता' : '🔴 बाकी देने हैं'}
              </span>
            </div>
          </div>

          <!-- Last Item Snippet -->
          <div style="font-size:0.7rem;color:var(--text-secondary);background:#f8fafc;padding:0.45rem 0.65rem;border-radius:8px;border:1px solid #e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${lastEntryText}
          </div>

          <!-- Action Buttons Bar -->
          <div style="display:flex;gap:0.4rem;align-items:center;border-top:1px solid #f1f5f9;padding-top:0.6rem">
            <button type="button" class="btn btn-xs btn-outline" style="flex:1;font-size:0.72rem;padding:0.45rem" onclick="khata.openShopPassbook('${shop.id}')">
              <span>📜</span>
              <span>पासबुक</span>
            </button>

            <button type="button" class="btn btn-xs btn-primary" style="flex:1.2;font-size:0.72rem;padding:0.45rem;background:${isSettled ? '#f1f5f9' : 'linear-gradient(135deg,#0c831f 0%,#15803d 100%)'};color:${isSettled ? '#64748b' : '#ffffff'};border:${isSettled ? '1px solid #cbd5e1' : 'none'}" onclick="khata.openStudentPayModal('${shop.id}')">
              <span>⚡</span>
              <span>${isSettled ? 'अग्रिम दें' : 'Pay Shop UPI'}</span>
            </button>

            <button type="button" class="btn btn-xs btn-outline" style="font-size:0.72rem;padding:0.45rem 0.65rem;border-color:#bae6fd;color:#0369a1;background:#f0f9ff" onclick="khata.openRoommateSplitModal('${shop.id}')" title="Split Bill with Roommates">
              <span>👥</span>
              <span>Split</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  },

  updateStudentMetrics() {
    let totalDue = 0;
    let totalPaid = 0;
    let pendingShops = 0;
    let settledShops = 0;

    this.shops.forEach(s => {
      if (s.balance > 0) {
        totalDue += s.balance;
        pendingShops++;
      } else {
        settledShops++;
      }
      totalPaid += (s.totalDebit || 0);
    });

    const dueEl = document.getElementById('studentTotalDue');
    const paidEl = document.getElementById('studentTotalPaid');
    const countEl = document.getElementById('studentActiveShops');

    if (dueEl) dueEl.textContent = `₹${totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (paidEl) paidEl.textContent = `₹${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (countEl) countEl.textContent = `${pendingShops} दुकानें`;

    const cAll = document.getElementById('countAllShops');
    const cPend = document.getElementById('countPendingShops');
    const cSet = document.getElementById('countSettledShops');

    if (cAll) cAll.textContent = this.shops.length;
    if (cPend) cPend.textContent = pendingShops;
    if (cSet) cSet.textContent = settledShops;
  },

  openStudentPayModal(shopId) {
    const shop = this.shops.find(s => s.id === shopId) || this.shops[0];
    if (!shop) return;

    this.selectedShopId = shop.id;
    const modal = document.getElementById('studentPayShopModal');
    if (!modal) return;

    document.getElementById('spsmTitle').textContent = `⚡ ${shop.name} को UPI भुगतान`;
    document.getElementById('spsmShopName').textContent = shop.name;
    document.getElementById('spsmShopLocation').textContent = `${shop.owner} • ${shop.upiVpa || 'UPI Verified'}`;
    document.getElementById('spsmDueAmount').textContent = `₹${shop.balance.toFixed(2)}`;

    const amtInput = document.getElementById('spsmAmount');
    if (amtInput) {
      amtInput.value = shop.balance > 0 ? shop.balance.toFixed(2) : '100';
    }

    modal.style.display = 'flex';
  },

  openRoommateSplitModal(shopId) {
    const shop = this.shops.find(s => s.id === shopId) || this.shops[0];
    if (!shop) return;

    this.splitState.shopId = shop.id;
    this.splitState.totalBill = shop.balance > 0 ? shop.balance : 180;
    this.splitState.peopleCount = 3;

    const modal = document.getElementById('roommateSplitModal');
    if (!modal) return;

    document.getElementById('rsmShopName').textContent = shop.name;
    document.getElementById('rsmBillNote').textContent = `${shop.category} • ${shop.location}`;
    document.getElementById('rsmTotalAmount').textContent = `₹${this.splitState.totalBill.toFixed(2)}`;

    this.updateSplitModalUI();
    modal.style.display = 'flex';
  },

  updateSplitModalUI() {
    const count = this.splitState.peopleCount;
    const total = this.splitState.totalBill;
    const perHead = Math.ceil(total / count);

    const lbl = document.getElementById('rsmPeopleCountLabel');
    const countDisplay = document.getElementById('rsmPeopleCount');
    const shareDisplay = document.getElementById('rsmPerHeadShare');
    const listEl = document.getElementById('rsmRoommatesList');

    if (lbl) lbl.textContent = `${count} लोग`;
    if (countDisplay) countDisplay.textContent = count;
    if (shareDisplay) shareDisplay.textContent = `₹${perHead.toFixed(2)}`;

    const roommates = DEFAULT_ROOMMATES.slice(0, count);
    if (listEl) {
      listEl.innerHTML = roommates.map((r, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.75rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:1.1rem">${i === 0 ? '👑' : '👤'}</span>
            <div>
              <strong style="font-size:0.82rem;color:var(--text-primary);display:block">${r.name}</strong>
              <small style="color:var(--text-secondary);font-size:0.68rem">${r.role} • ${r.phone}</small>
            </div>
          </div>
          <div style="text-align:right">
            <strong style="font-family:var(--font-heading);font-size:0.95rem;color:var(--text-primary)">₹${perHead}</strong>
            <span style="display:block;font-size:0.62rem;color:${i === 0 ? '#15803d' : '#f59e0b'};font-weight:700">
              ${i === 0 ? '✓ आपने दिया' : '⏳ बाकी लेना'}
            </span>
          </div>
        </div>
      `).join('');
    }
  },

  shareSplitOnWhatsApp() {
    const shop = this.shops.find(s => s.id === this.splitState.shopId);
    const shopName = shop ? shop.name : 'Campus Shop';
    const total = this.splitState.totalBill;
    const perHead = Math.ceil(total / this.splitState.peopleCount);

    let msg = `*Hey bro! Campus Udhar Bill Split:* 🍕\n\n`;
    msg += `📍 *Shop:* ${shopName}\n`;
    msg += `💰 *Total Bill:* ₹${total.toFixed(2)}\n`;
    msg += `👥 *Split between ${this.splitState.peopleCount} roommates*\n`;
    msg += `👉 *Your Share:* *₹${perHead.toFixed(2)}*\n\n`;
    msg += `Please pay me back via DesiPay UPI:\n`;
    msg += `upi://pay?pa=rahulverma@desipay&pn=RahulVerma&am=${perHead}&cu=INR\n\n`;
    msg += `_Powered by DesiPay Smart Kirana & Campus ERP_`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
    app.showToast('Opening WhatsApp to share split request...', 'info');
  },

  openShopPassbook(shopId) {
    const shop = this.shops.find(s => s.id === shopId);
    if (!shop) return;

    this.selectedShopId = shopId;
    const sheet = document.getElementById('shopPassbookSheetOverlay');
    if (!sheet) return;

    const isSettled = shop.balance === 0;

    // Header info
    document.getElementById('spbAvatar').textContent = shop.avatar || '🏪';
    document.getElementById('spbShopName').textContent = shop.name;
    document.getElementById('spbShopLocation').textContent = `${shop.location} • ${shop.owner}`;

    // Balance cards
    const netBalEl = document.getElementById('spbNetBalance');
    const badgeEl = document.getElementById('spbStatusBadge');
    const totCredEl = document.getElementById('spbTotalCredit');
    const totDebEl = document.getElementById('spbTotalDebit');

    if (netBalEl) {
      netBalEl.textContent = `₹${shop.balance.toFixed(2)}`;
      netBalEl.style.color = isSettled ? '#0c831f' : '#dc2626';
    }
    if (badgeEl) {
      badgeEl.textContent = isSettled ? '🟢 हिसाब चुकता' : '🔴 बाकी देने हैं';
      badgeEl.style.background = isSettled ? '#dcfce7' : '#fee2e2';
      badgeEl.style.color = isSettled ? '#0c831f' : '#dc2626';
    }
    if (totCredEl) totCredEl.textContent = `+₹${(shop.totalCredit || 0).toFixed(2)}`;
    if (totDebEl) totDebEl.textContent = `-₹${(shop.totalDebit || 0).toFixed(2)}`;

    // Timeline entries
    const timelineList = document.getElementById('spbTimelineList');
    const countLabel = document.getElementById('spbEntriesCount');

    if (countLabel) countLabel.textContent = `(${shop.entries.length} रसीदें)`;

    if (!shop.entries || shop.entries.length === 0) {
      timelineList.innerHTML = `
        <div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.8rem">
          इस दुकान पर कोई रसीद दर्ज नहीं है।
        </div>
      `;
    } else {
      timelineList.innerHTML = shop.entries.map(e => {
        const isCredit = e.type === 'CREDIT';
        const formattedDate = new Date(e.date).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <div class="cpb-timeline-entry" style="display:flex;align-items:center;justify-content:space-between;padding:0.7rem 0.85rem;background:#ffffff;border:1px solid var(--border-light);border-radius:12px;box-shadow:var(--shadow-sm)">
            <div style="display:flex;flex-direction:column;gap:2px;max-width:65%">
              <div style="display:flex;align-items:center;gap:0.35rem">
                <span style="font-size:0.62rem;font-weight:800;padding:2px 6px;border-radius:6px;background:${isCredit ? '#fee2e2' : '#dcfce7'};color:${isCredit ? '#dc2626' : '#0c831f'}">
                  ${isCredit ? '🔴 सामान लिया (Udhar)' : '🟢 भुगतान किया (Paid)'}
                </span>
                <span style="font-size:0.65rem;color:var(--text-muted)">${formattedDate}</span>
              </div>
              <strong style="font-size:0.82rem;color:var(--text-primary);line-height:1.2;margin-top:2px">${e.desc}</strong>
              <small style="font-size:0.68rem;color:var(--text-muted)">दुकान पर बाकी: ₹${(e.balanceAfter !== undefined ? e.balanceAfter : shop.balance).toFixed(2)}</small>
            </div>

            <div style="text-align:right">
              <span style="font-family:var(--font-heading);font-size:1.15rem;font-weight:900;color:${isCredit ? '#dc2626' : '#0c831f'}">
                ${isCredit ? '+' : '-'}₹${e.amount.toFixed(2)}
              </span>
              ${e.paymentMethod ? `<div style="font-size:0.62rem;color:var(--text-muted);font-weight:600">${e.paymentMethod}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    sheet.style.display = 'flex';
  },

  // =========================================================================
  // DUKANDAAR VIEW: RENDER CUSTOMER DEBTORS
  // =========================================================================

  renderCustomerList() {
    const list = document.getElementById('vyaparDebtorsMobileList');
    if (!list) return;

    let filtered = this.customers;

    if (this.activeFilter === 'pending') {
      filtered = filtered.filter(c => c.balance > 0);
    } else if (this.activeFilter === 'settled') {
      filtered = filtered.filter(c => c.balance === 0);
    }

    if (this.searchQuery) {
      filtered = filtered.filter(c => 
        c.fullName.toLowerCase().includes(this.searchQuery) ||
        c.phone.includes(this.searchQuery) ||
        (c.address && c.address.toLowerCase().includes(this.searchQuery))
      );
    }

    if (filtered.length === 0) {
      list.innerHTML = `
        <div style="background:#ffffff;border:1px solid var(--border-light);border-radius:14px;padding:2rem 1rem;text-align:center;box-shadow:var(--shadow-sm)">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">📒</div>
          <strong style="display:block;font-size:0.95rem;color:var(--text-primary)">कोई ग्राहक नहीं मिला</strong>
          <small style="color:var(--text-muted);font-size:0.75rem">नया ग्राहक जोड़ने के लिए ऊपर <b>+ नया ग्राहक</b> पर टैप करें।</small>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(c => {
      const initials = c.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'KH';
      const isSettled = c.balance === 0;
      const lastEntry = c.entries && c.entries.length > 0 ? c.entries[0] : null;

      let lastEntryText = 'No transactions yet';
      if (lastEntry) {
        const timeAgo = this.formatDate(lastEntry.date);
        if (lastEntry.type === 'CREDIT') {
          lastEntryText = `<span style="color:#dc2626;font-weight:700">🔴 +₹${lastEntry.amount}</span> (${lastEntry.desc}) • ${timeAgo}`;
        } else {
          lastEntryText = `<span style="color:#0c831f;font-weight:700">🟢 -₹${lastEntry.amount}</span> (${lastEntry.desc}) • ${timeAgo}`;
        }
      }

      return `
        <div class="m-khata-card" style="display:flex;flex-direction:column;gap:0.75rem;padding:0.9rem 1rem;background:#ffffff;border:1px solid var(--border-light);border-radius:14px;box-shadow:var(--shadow-card)">
          
          <!-- Customer Top Info -->
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;align-items:center;gap:0.65rem">
              <div style="width:38px;height:38px;border-radius:50%;background:${isSettled ? '#dcfce7' : '#fee2e2'};color:${isSettled ? '#0c831f' : '#dc2626'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.88rem;border:1px solid ${isSettled ? '#86efac' : '#fca5a5'}">
                ${initials}
              </div>
              <div>
                <strong style="font-size:0.92rem;color:var(--text-primary);display:block;line-height:1.2">${c.fullName}</strong>
                <small style="color:var(--text-secondary);font-size:0.7rem">${c.address} • ${c.phone}</small>
              </div>
            </div>

            <div style="text-align:right">
              <div style="font-family:var(--font-heading);font-size:1.15rem;font-weight:900;color:${isSettled ? '#0c831f' : '#dc2626'}">
                ${isSettled ? '₹0.00' : '₹' + c.balance.toFixed(2)}
              </div>
              <span style="font-size:0.62rem;font-weight:700;padding:2px 6px;border-radius:8px;background:${isSettled ? '#dcfce7' : '#fee2e2'};color:${isSettled ? '#0c831f' : '#dc2626'}">
                ${isSettled ? '🟢 चुकता' : '🔴 बाकी लेने हैं'}
              </span>
            </div>
          </div>

          <!-- Last Transaction Snippet -->
          <div style="font-size:0.7rem;color:var(--text-secondary);background:#f8fafc;padding:0.45rem 0.65rem;border-radius:8px;border:1px solid #e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${lastEntryText}
          </div>

          <!-- Action Buttons Bar -->
          <div style="display:flex;gap:0.4rem;align-items:center;border-top:1px solid #f1f5f9;padding-top:0.6rem">
            <button type="button" class="btn btn-xs btn-outline" style="flex:1;font-size:0.72rem;padding:0.4rem" onclick="khata.openPassbook('${c.id}')">
              <span>📖</span>
              <span>पासबुक</span>
            </button>

            <button type="button" class="btn btn-xs btn-primary" style="flex:1.2;font-size:0.72rem;padding:0.4rem;background:${isSettled ? '#f1f5f9' : 'linear-gradient(135deg,#0c831f 0%,#15803d 100%)'};color:${isSettled ? '#64748b' : '#ffffff'};border:${isSettled ? '1px solid #cbd5e1' : 'none'}" onclick="khata.openSettleModal('${c.id}')">
              <span>🟢</span>
              <span>${isSettled ? 'जमा लें' : 'जमा काटें'}</span>
            </button>

            <button type="button" class="btn btn-xs btn-outline" style="font-size:0.72rem;padding:0.4rem 0.6rem;border-color:#86efac;color:#15803d;background:#ecfdf5" onclick="khata.sendWhatsAppStatement('${c.id}')" title="Send WhatsApp Payment Reminder">
              <span>📲</span>
              <span>WhatsApp</span>
            </button>
          </div>

        </div>
      `;
    }).join('');
  },

  updateDukandaarMetrics() {
    let totalPending = 0;
    let totalSettled = 0;
    let countPending = 0;
    let countSettled = 0;

    this.customers.forEach(c => {
      if (c.balance > 0) {
        totalPending += c.balance;
        countPending++;
      } else {
        countSettled++;
      }
      totalSettled += (c.totalDebit || 0);
    });

    const pendingEl = document.getElementById('khataTotalPending');
    const settledEl = document.getElementById('khataTotalSettled');
    const customersEl = document.getElementById('khataTotalCustomers');

    if (pendingEl) pendingEl.textContent = `₹${totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (settledEl) settledEl.textContent = `₹${totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (customersEl) customersEl.textContent = this.customers.length;

    const cAll = document.getElementById('countAllCust');
    const cPend = document.getElementById('countPendingCust');
    const cSet = document.getElementById('countSettledCust');

    if (cAll) cAll.textContent = this.customers.length;
    if (cPend) cPend.textContent = countPending;
    if (cSet) cSet.textContent = countSettled;

    // Sync with Dukandaar POS Cashbook card 2 (Market Udhar)
    const vyaparUdharEl = document.getElementById('vyaparTotalUdhar');
    if (vyaparUdharEl) {
      vyaparUdharEl.textContent = `₹${totalPending.toLocaleString('en-IN')}`;
    }
  },

  populateCustomerChipsInModal() {
    const chipsContainer = document.querySelector('.quick-customer-chips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = this.customers.slice(0, 5).map((c, i) => `
      <button type="button" class="btn btn-xs btn-customer-chip ${i === 0 ? 'active' : ''}" data-id="${c.id}" data-name="${c.fullName}">
        👤 ${c.fullName.split(' ')[0]}
      </button>
    `).join('');

    chipsContainer.querySelectorAll('.btn-customer-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.btn-customer-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const custInput = document.getElementById('khataCustomerId');
        if (custInput) custInput.value = chip.dataset.id;
      });
    });

    const custInput = document.getElementById('khataCustomerId');
    if (custInput && this.customers[0]) {
      custInput.value = this.customers[0].id;
    }
  },

  openPassbook(customerId) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    this.selectedCustomerId = customerId;
    const sheet = document.getElementById('customerPassbookSheetOverlay');
    if (!sheet) return;

    const initials = cust.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'KH';
    const isSettled = cust.balance === 0;

    document.getElementById('cpbAvatar').textContent = initials;
    document.getElementById('cpbCustomerName').textContent = cust.fullName;
    document.getElementById('cpbCustomerPhone').textContent = `${cust.address} • ${cust.phone}`;

    const netBalEl = document.getElementById('cpbNetBalance');
    const badgeEl = document.getElementById('cpbStatusBadge');
    const totCredEl = document.getElementById('cpbTotalCredit');
    const totDebEl = document.getElementById('cpbTotalDebit');

    if (netBalEl) {
      netBalEl.textContent = `₹${cust.balance.toFixed(2)}`;
      netBalEl.style.color = isSettled ? '#0c831f' : '#dc2626';
    }
    if (badgeEl) {
      badgeEl.textContent = isSettled ? '🟢 हिसाब चुकता' : '🔴 बाकी लेने हैं';
      badgeEl.style.background = isSettled ? '#dcfce7' : '#fee2e2';
      badgeEl.style.color = isSettled ? '#0c831f' : '#dc2626';
    }
    if (totCredEl) totCredEl.textContent = `+₹${(cust.totalCredit || 0).toFixed(2)}`;
    if (totDebEl) totDebEl.textContent = `-₹${(cust.totalDebit || 0).toFixed(2)}`;

    const timelineList = document.getElementById('cpbTimelineList');
    const countLabel = document.getElementById('cpbEntriesCount');

    if (countLabel) countLabel.textContent = `(${cust.entries.length} एंट्री)`;

    if (!cust.entries || cust.entries.length === 0) {
      timelineList.innerHTML = `
        <div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.8rem">
          इस ग्राहक का कोई लेन-देन दर्ज नहीं है।
        </div>
      `;
    } else {
      timelineList.innerHTML = cust.entries.map(e => {
        const isCredit = e.type === 'CREDIT';
        const formattedDate = new Date(e.date).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <div class="cpb-timeline-entry" style="display:flex;align-items:center;justify-content:space-between;padding:0.7rem 0.85rem;background:#ffffff;border:1px solid var(--border-light);border-radius:12px;box-shadow:var(--shadow-sm)">
            <div style="display:flex;flex-direction:column;gap:2px;max-width:65%">
              <div style="display:flex;align-items:center;gap:0.35rem">
                <span style="font-size:0.62rem;font-weight:800;padding:2px 6px;border-radius:6px;background:${isCredit ? '#fee2e2' : '#dcfce7'};color:${isCredit ? '#dc2626' : '#0c831f'}">
                  ${isCredit ? '🔴 उधार दिया (Gave)' : '🟢 जमा काटा (Got)'}
                </span>
                <span style="font-size:0.65rem;color:var(--text-muted)">${formattedDate}</span>
              </div>
              <strong style="font-size:0.82rem;color:var(--text-primary);line-height:1.2;margin-top:2px">${e.desc || (isCredit ? 'Kirana Goods' : 'Payment')}</strong>
              <small style="font-size:0.68rem;color:var(--text-muted)">बाकी बैलेंस: ₹${(e.balanceAfter !== undefined ? e.balanceAfter : cust.balance).toFixed(2)}</small>
            </div>

            <div style="text-align:right">
              <span style="font-family:var(--font-heading);font-size:1.15rem;font-weight:900;color:${isCredit ? '#dc2626' : '#0c831f'}">
                ${isCredit ? '+' : '-'}₹${e.amount.toFixed(2)}
              </span>
              ${e.paymentMethod ? `<div style="font-size:0.62rem;color:var(--text-muted);font-weight:600">${e.paymentMethod}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    sheet.style.display = 'flex';
  },

  openSettleModal(customerId) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    this.selectedCustomerId = customerId;
    const modal = document.getElementById('customerSettleModal');
    if (!modal) return;

    document.getElementById('csmTitle').textContent = `${cust.fullName} का हिसाब चुकता करें`;
    document.getElementById('csmPendingAmount').textContent = `₹${cust.balance.toFixed(2)}`;

    const amtInput = document.getElementById('csmAmount');
    if (amtInput) {
      amtInput.value = cust.balance > 0 ? cust.balance.toFixed(2) : '100';
    }

    modal.style.display = 'flex';
  },

  openAddCreditModal(customerId) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    const modal = document.getElementById('khataSheetOverlay');
    if (!modal) return;

    const custInput = document.getElementById('khataCustomerId');
    if (custInput) custInput.value = cust.id;

    const radioCredit = document.getElementById('radioKhataCredit');
    if (radioCredit) radioCredit.checked = true;
    const hiddenType = document.getElementById('khataType');
    if (hiddenType) hiddenType.value = 'CREDIT';

    modal.style.display = 'flex';
  },

  sendWhatsAppStatement(customerId) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    const cleanPhone = (cust.phone || '+919800000002').replace(/[^0-9]/g, '');
    const isSettled = cust.balance === 0;

    let msg = `*Namaste ${cust.fullName} ji!* 🙏\n\n`;
    msg += `*Om Kirana Store (DesiPay डिजिटल खाता)*\n`;
    msg += `--------------------------------\n`;
    msg += `🔴 कुल उधार लिया: *₹${(cust.totalCredit || 0).toFixed(2)}*\n`;
    msg += `🟢 कुल जमा/काटा: *₹${(cust.totalDebit || 0).toFixed(2)}*\n`;
    msg += `--------------------------------\n`;

    if (isSettled) {
      msg += `✅ *आपका हिसाब पूर्ण रूप से चुकता है! धन्यवाद।* 🙏\n`;
    } else {
      msg += `⚠️ *बाकी देय राशि (Net Due): ₹${cust.balance.toFixed(2)}*\n\n`;
      msg += `Kripya is link se UPI (PhonePe/GPay/Paytm) dwara payment kar dijiye:\n`;
      msg += `http://localhost:3001\n`;
    }

    msg += `\n_DesiPay 4G Smart Soundbox Verified Ledger_`;

    const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waLink, '_blank');
    app.showToast(`Opening WhatsApp statement for ${cust.fullName}...`, 'info');
  },

  formatDate(dateStr) {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
};

window.khata = khata;
