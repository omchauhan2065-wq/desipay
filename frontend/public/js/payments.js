/**
 * Payments Module — Payment list & creation
 */

const payments = {
  init() {
    document.getElementById('createPaymentBtn').addEventListener('click', () => {
      document.getElementById('paymentModal').style.display = 'flex';
    });

    document.querySelector('[data-close="paymentModal"]').addEventListener('click', () => {
      document.getElementById('paymentModal').style.display = 'none';
    });

    document.getElementById('createPaymentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('paymentError');
      errEl.textContent = '';

      try {
        const result = await api.post('/payments/order', {
          amount: parseFloat(document.getElementById('payAmount').value),
          description: document.getElementById('payDesc').value || undefined,
        });

        document.getElementById('paymentModal').style.display = 'none';
        document.getElementById('createPaymentForm').reset();
        app.showToast(`Payment order created! Razorpay ID: ${result.data.razorpayOrderId}`, 'success');
        this.load();
      } catch (error) {
        errEl.textContent = error.message;
      }
    });
  },

  async load() {
    try {
      const result = await api.get('/payments?limit=20');
      const tbody = document.getElementById('paymentsBody');

      if (!result?.data?.payments?.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No payments found</td></tr>';
        return;
      }

      tbody.innerHTML = result.data.payments.map(p => `
        <tr>
          <td>${new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
          <td style="font-weight:700">₹${p.amount.toFixed(2)}</td>
          <td>${p.paymentMethod || '-'}</td>
          <td><span class="status status-${p.status.toLowerCase()}">${p.status}</span></td>
          <td style="font-size:0.75rem;color:var(--text-muted)">${(p.razorpayPaymentId || p.razorpayOrderId || '-').slice(-12)}</td>
        </tr>
      `).join('');
    } catch (error) {
      console.warn('Payments load error:', error.message);
    }
  },
};
