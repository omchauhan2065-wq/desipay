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

    const form = document.getElementById('createKhataForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('khataError');
        if (errEl) errEl.textContent = '';

        try {
          const customerId = document.getElementById('khataCustomerId')?.value.trim();
          const entryType = document.getElementById('khataType')?.value || 'CREDIT';
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
};
