/**
 * Payments Module — Payment Orders & History (Mobile-First)
 * =========================================================
 * Developed by: Om Chauhan
 */

const payments = {
  init() {
    const triggerBtn = document.getElementById('createPaymentTabBtn') || document.getElementById('createPaymentBtn');
    const paymentSheet = document.getElementById('paymentSheetOverlay') || document.getElementById('paymentModal');

    if (triggerBtn && paymentSheet) {
      triggerBtn.addEventListener('click', () => {
        paymentSheet.style.display = 'flex';
      });
    }

    // Preset Amount Chips in Payment Sheet
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const amtInput = document.getElementById('payAmount');
        if (amtInput) amtInput.value = chip.dataset.val;
      });
    });

    // Quick Description Chips
    document.querySelectorAll('.pay-desc-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const descInput = document.getElementById('payDesc');
        if (descInput) descInput.value = tag.dataset.desc;
      });
    });

    const form = document.getElementById('createPaymentForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('paymentError');
        if (errEl) errEl.textContent = '';

        try {
          const amount = parseFloat(document.getElementById('payAmount')?.value || '0');
          const desc = document.getElementById('payDesc')?.value || 'Payment Order';

          const result = await api.post('/payments/order', {
            amount,
            description: desc || undefined,
          });

          if (paymentSheet) paymentSheet.style.display = 'none';
          form.reset();

          app.showToast(`Payment order created! Razorpay ID: ${result.data.razorpayOrderId}`, 'success');

          // Trigger soundbox voice if dukandaar
          if (app.speakSoundbox) app.speakSoundbox(amount);

          this.load();
        } catch (error) {
          if (errEl) errEl.textContent = error.message;
          app.showToast(error.message, 'error');
        }
      });
    }
  },

  async load() {
    try {
      const result = await api.get('/payments?limit=20');
      const paymentsList = result?.data?.payments || [];

      // Mobile list
      const mobileContainer = document.getElementById('paymentsMobileList');
      if (mobileContainer) {
        if (paymentsList.length === 0) {
          mobileContainer.innerHTML = '<div class="empty-state">No payment transactions yet.</div>';
        } else {
          mobileContainer.innerHTML = paymentsList.map(p => `
            <div class="m-khata-card">
              <div class="mkc-info">
                <strong style="color:#ffffff;font-size:0.95rem">₹${p.amount.toFixed(2)}</strong>
                <small>${new Date(p.createdAt).toLocaleDateString('en-IN')} • ${p.paymentMethod || 'UPI'}</small>
                ${p.description ? `<small style="color:var(--text-secondary);margin-top:2px">${p.description}</small>` : ''}
              </div>
              <div class="mkc-right" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                <span class="status status-${p.status.toLowerCase()}">${p.status}</span>
                ${p.status === 'PENDING' ? `
                  <button type="button" class="btn btn-xs btn-outline" style="font-size:0.68rem;padding:2px 8px" onclick="payments.simulateSuccess('${p.id}', ${p.amount})">⚡ Pay UPI</button>
                ` : ''}
                <span style="font-size:0.65rem;color:var(--text-muted)">${(p.razorpayPaymentId || p.razorpayOrderId || '-').slice(-10)}</span>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      console.warn('Payments load error:', error.message);
    }
  },

  async simulateSuccess(paymentId, amount) {
    app.showToast(`Simulating successful UPI payment for ₹${amount}...`, 'info');
    if (app.speakSoundbox) app.speakSoundbox(amount);
    setTimeout(() => {
      app.showToast(`Payment ₹${amount} received via UPI!`, 'success');
      this.load();
    }, 600);
  },
};

window.payments = payments;
