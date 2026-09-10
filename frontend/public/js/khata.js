/**
 * DesiPay Advanced Khata Module — Digital Ledger & Customer Settlement
 * ===================================================================
 * Customer-Wise Ledger Statement & Passbook:
 * - Customer list with real-time Net Balances (Credit Diya / Debit Se Cut Kiya)
 * - Individual Customer Passbook Timeline with itemized statement history
 * - 1-Click Settlement / Payment Cut with Soundbox Voice Announcement
 * - 1-Tap Itemized WhatsApp Statement & Reminders
 * - Add New Customer & Flexible Udhar / Jama entries
 * 
 * Developed by: Om Chauhan
 */

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

const khata = {
  customers: [],
  activeFilter: 'all', // 'all' | 'pending' | 'settled'
  searchQuery: '',
  selectedCustomerId: null,

  init() {
    this.loadInitialData();
    this.bindEvents();
    this.renderCustomerList();
    this.updateMetrics();
  },

  loadInitialData() {
    try {
      const stored = localStorage.getItem('desipay_khata_customers_v2');
      if (stored) {
        this.customers = JSON.parse(stored);
      } else {
        this.customers = JSON.parse(JSON.stringify(DEFAULT_KHATA_CUSTOMERS));
        this.saveData();
      }
    } catch {
      this.customers = JSON.parse(JSON.stringify(DEFAULT_KHATA_CUSTOMERS));
    }
  },

  saveData() {
    try {
      localStorage.setItem('desipay_khata_customers_v2', JSON.stringify(this.customers));
    } catch {}
  },

  bindEvents() {
    // 1. Search Input
    const searchInput = document.getElementById('khataSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderCustomerList();
      });
    }

    // 2. Filter Pills
    document.querySelectorAll('#khataFilterPills .m-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#khataFilterPills .m-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.dataset.filter || 'all';
        this.renderCustomerList();
      });
    });

    // 3. Trigger New Entry Modal
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

    // 4. Trigger Add New Customer Modal
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

    // 5. Add New Customer Form Submit
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

        app.showToast(`ग्राहक जोड़ा गया: ${fullName}`, 'success');
        this.renderCustomerList();
        this.updateMetrics();
        this.openPassbook(newId);
      });
    }

    // 6. Close Passbook Sheet
    const closePassbookBtn = document.getElementById('closePassbookSheetBtn');
    const passbookSheet = document.getElementById('customerPassbookSheetOverlay');
    if (closePassbookBtn && passbookSheet) {
      closePassbookBtn.addEventListener('click', () => {
        passbookSheet.style.display = 'none';
      });
    }

    // Passbook Action Buttons
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

    // 7. Customer Settle Modal Handlers
    const closeSettleBtn = document.getElementById('closeCustomerSettleBtn');
    const settleModal = document.getElementById('customerSettleModal');
    if (closeSettleBtn && settleModal) {
      closeSettleBtn.addEventListener('click', () => {
        settleModal.style.display = 'none';
      });
    }

    // Quick settle amount chips
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

    // Settle Form Submit (Cut from Balance)
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

        // Try backend settle API call if connected
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

        // Cut from customer balance in state
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
        this.saveData();

        if (settleModal) settleModal.style.display = 'none';
        settleForm.reset();

        // Audio and voice confirmation
        app.showToast(`✅ ₹${settleAmount} ${cust.fullName} के खाते से काट दिया गया!`, 'success');
        if (app.speakSoundbox) {
          app.speakSoundbox(settleAmount);
        }

        this.renderCustomerList();
        this.updateMetrics();
        this.openPassbook(cust.id);
      });
    }

    // 8. General Entry Form (Sheet 4)
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
            // Find by name or create
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

          this.saveData();

          // Try sync with backend
          try {
            if (window.api?.isAuthenticated?.()) {
              await window.api.post('/khata/entry', {
                customerId: cust.id,
                entryType,
                amount,
                description: desc,
              }).catch(() => {});
            }
          } catch {}

          if (khataSheet) khataSheet.style.display = 'none';
          form.reset();

          app.showToast(`Khata entry saved! ${entryType === 'CREDIT' ? '🔴 उधार दिया' : '🟢 पैसा मिला'}: ₹${amount} (${cust.fullName})`, 'success');

          if (entryType === 'DEBIT' && app.speakSoundbox) {
            app.speakSoundbox(amount);
          }

          this.renderCustomerList();
          this.updateMetrics();
        } catch (error) {
          if (errEl) errEl.textContent = error.message;
          app.showToast(error.message, 'error');
        }
      });
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

    // Re-bind click
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

  renderCustomerList() {
    const list = document.getElementById('vyaparDebtorsMobileList');
    if (!list) return;

    let filtered = this.customers;

    // Filter tab
    if (this.activeFilter === 'pending') {
      filtered = filtered.filter(c => c.balance > 0);
    } else if (this.activeFilter === 'settled') {
      filtered = filtered.filter(c => c.balance === 0);
    }

    // Search query
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
          <small style="color:var(--text-muted);font-size:0.75rem">नया ग्राहक जोड़ने के लिए ऊपर <b>+ ग्राहक जोड़ें</b> पर टैप करें।</small>
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

  updateMetrics() {
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

    // Filter pill count badges
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

  openPassbook(customerId) {
    const cust = this.customers.find(c => c.id === customerId);
    if (!cust) return;

    this.selectedCustomerId = customerId;
    const sheet = document.getElementById('customerPassbookSheetOverlay');
    if (!sheet) return;

    const initials = cust.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'KH';
    const isSettled = cust.balance === 0;

    // Header info
    document.getElementById('cpbAvatar').textContent = initials;
    document.getElementById('cpbCustomerName').textContent = cust.fullName;
    document.getElementById('cpbCustomerPhone').textContent = `${cust.address} • ${cust.phone}`;

    // Balance cards
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

    // Timeline entries
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

    // Set customer
    const custInput = document.getElementById('khataCustomerId');
    if (custInput) custInput.value = cust.id;

    // Set CREDIT radio
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
