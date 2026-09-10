/**
 * Khata Module — Digital ledger UI
 */

const khata = {
  init() {
    document.getElementById('createKhataBtn').addEventListener('click', () => {
      document.getElementById('khataModal').style.display = 'flex';
    });

    document.querySelector('[data-close="khataModal"]').addEventListener('click', () => {
      document.getElementById('khataModal').style.display = 'none';
    });

    document.getElementById('createKhataForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('khataError');
      errEl.textContent = '';

      try {
        await api.post('/khata/entry', {
          customerId: document.getElementById('khataCustomerId').value,
          entryType: document.getElementById('khataType').value,
          amount: parseFloat(document.getElementById('khataAmount').value),
          description: document.getElementById('khataDesc').value || undefined,
        });

        document.getElementById('khataModal').style.display = 'none';
        document.getElementById('createKhataForm').reset();
        app.showToast('Khata entry recorded!', 'success');
        this.load();
      } catch (error) {
        errEl.textContent = error.message;
      }
    });
  },

  async load() {
    try {
      const result = await api.get('/khata/dashboard');
      const tbody = document.getElementById('khataBody');

      if (!result?.data?.recentEntries?.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No khata entries</td></tr>';
        return;
      }

      tbody.innerHTML = result.data.recentEntries.map(e => `
        <tr>
          <td>${new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
          <td>${e.customer?.fullName || e.customerId?.slice(0, 8)}</td>
          <td><span class="status status-${e.entryType.toLowerCase()}">${e.entryType === 'CREDIT' ? 'Udhar' : 'Vasool'}</span></td>
          <td style="font-weight:700">₹${e.amount.toFixed(2)}</td>
          <td>₹${e.balanceAfter.toFixed(2)}</td>
          <td><span class="status ${e.isSettled ? 'status-settled' : 'status-unsettled'}">${e.isSettled ? 'Settled' : 'Pending'}</span></td>
        </tr>
      `).join('');
    } catch (error) {
      // Fallback for customers — show my-udhar
      try {
        const result = await api.get('/khata/my-udhar?limit=20');
        const tbody = document.getElementById('khataBody');

        if (!result?.data?.entries?.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No credit entries</td></tr>';
          return;
        }

        tbody.innerHTML = result.data.entries.map(e => `
          <tr>
            <td>${new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
            <td>${e.shopkeeper?.fullName || '-'}</td>
            <td><span class="status status-${e.entryType.toLowerCase()}">${e.entryType}</span></td>
            <td style="font-weight:700">₹${e.amount.toFixed(2)}</td>
            <td>₹${e.balanceAfter.toFixed(2)}</td>
            <td><span class="status ${e.isSettled ? 'status-settled' : 'status-unsettled'}">${e.isSettled ? 'Settled' : 'Pending'}</span></td>
          </tr>
        `).join('');
      } catch (err) {
        console.warn('Khata load error:', err.message);
      }
    }
  },
};
