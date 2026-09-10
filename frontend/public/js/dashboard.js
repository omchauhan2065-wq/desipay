/**
 * Dashboard Module — Overview Stats
 */

const dashboard = {
  async load() {
    try {
      // Load payment history for revenue
      const payments = await api.get('/payments?limit=100&status=COMPLETED').catch(() => ({ data: { payments: [] } }));
      const totalRevenue = (payments?.data?.payments || []).reduce((sum, p) => sum + p.amount, 0);
      document.getElementById('statRevenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;

      // Load khata dashboard
      const khata = await api.get('/khata/dashboard').catch(() => ({ data: {} }));
      if (khata?.data) {
        document.getElementById('statUdhar').textContent = `₹${(khata.data.totalOutstanding || 0).toLocaleString('en-IN')}`;

        // Top debtors
        const debtorsBody = document.getElementById('debtorsBody');
        if (khata.data.topDebtors?.length) {
          debtorsBody.innerHTML = khata.data.topDebtors.map(d => `
            <tr>
              <td>${d.fullName || 'Unknown'}</td>
              <td style="font-weight:700;color:var(--danger)">₹${(d.balance || 0).toFixed(2)}</td>
              <td>${d.phone || '-'}</td>
            </tr>
          `).join('');
        }

        // Recent entries as transactions
        const txBody = document.getElementById('recentTxBody');
        if (khata.data.recentEntries?.length) {
          txBody.innerHTML = khata.data.recentEntries.map(e => `
            <tr>
              <td>${new Date(e.createdAt).toLocaleDateString('en-IN')}</td>
              <td><span class="status status-${e.entryType.toLowerCase()}">${e.entryType}</span></td>
              <td style="font-weight:600">₹${e.amount.toFixed(2)}</td>
              <td><span class="status ${e.isSettled ? 'status-settled' : 'status-unsettled'}">${e.isSettled ? 'Settled' : 'Pending'}</span></td>
            </tr>
          `).join('');
        }
      }

      // Load inventory stats
      const inv = await api.get('/inventory/products?limit=1').catch(() => ({ data: { total: 0 } }));
      document.getElementById('statProducts').textContent = inv?.data?.total || 0;

      const lowStock = await api.get('/inventory/low-stock').catch(() => ({ data: { count: 0 } }));
      document.getElementById('statAlerts').textContent = lowStock?.data?.count || 0;
    } catch (error) {
      console.warn('Dashboard load error:', error.message);
    }
  },
};
