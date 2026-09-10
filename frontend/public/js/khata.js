/**
 * Khata Module — Digital Ledger & Udhar Recording (Mobile-First)
 * =============================================================
 * Developed by: Om Chauhan
 */

const khata = {
  init() {
    const triggerBtn = document.getElementById('createKhataTabBtn') || document.getElementById('createKhataBtn');
    const khataSheet = document.getElementById('khataSheetOverlay') || document.getElementById('khataModal');

    if (triggerBtn && khataSheet) {
      triggerBtn.addEventListener('click', () => {
        khataSheet.style.display = 'flex';
      });
    }

    // Customer Selection Chips
    document.querySelectorAll('.btn-customer-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.btn-customer-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const custInput = document.getElementById('khataCustomerId');
        if (custInput) custInput.value = chip.dataset.id;
        const descInput = document.getElementById('khataDesc');
        if (descInput) descInput.value = `Kirana items for ${chip.dataset.name}`;
      });
    });

    // Khata Amount Preset Chips
    document.querySelectorAll('.khata-preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.khata-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const amtInput = document.getElementById('khataAmount');
        if (amtInput) amtInput.value = chip.dataset.val;
      });
    });

    // Khata Entry Type Radio Toggle
    document.querySelectorAll('input[name="khataTypeRadio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const hiddenType = document.getElementById('khataType');
        if (hiddenType) hiddenType.value = radio.value;
      });
    });

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
          const desc = document.getElementById('khataDesc')?.value || undefined;

          await api.post('/khata/entry', {
            customerId,
            entryType,
            amount,
            description: desc,
          });

          if (khataSheet) khataSheet.style.display = 'none';
          form.reset();

          app.showToast(`Khata entry recorded! ${entryType === 'CREDIT' ? 'उधार दिया' : 'पैसा मिला'}: ₹${amount}`, 'success');

          // Trigger soundbox voice if debited / received
          if (entryType === 'DEBIT' && app.speakSoundbox) {
            app.speakSoundbox(amount);
          }

          this.load();
          if (app.loadKhataTabData) app.loadKhataTabData();
        } catch (error) {
          if (errEl) errEl.textContent = error.message;
          app.showToast(error.message, 'error');
        }
      });
    }
  },

  async load() {
    if (app.loadKhataTabData) {
      await app.loadKhataTabData();
    }
  },

  async settleDebtor(debtorName, amount) {
    app.showToast(`Vasooli recorded: ₹${amount} received from ${debtorName}`, 'success');
    if (app.speakSoundbox) app.speakSoundbox(amount);
    setTimeout(() => {
      if (app.loadKhataTabData) app.loadKhataTabData();
      if (app.loadVyaparStats) app.loadVyaparStats();
    }, 500);
  },
};
