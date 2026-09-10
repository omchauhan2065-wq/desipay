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
              </div>
              <div class="mkc-right">
                <span class="status status-${p.status.toLowerCase()}">${p.status}</span>
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
};
