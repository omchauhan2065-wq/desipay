/**
 * Inventory Module — Products & Stock
 */

const inventory = {
  init() {
    document.getElementById('addProductBtn').addEventListener('click', () => {
      document.getElementById('productModal').style.display = 'flex';
    });

    document.querySelector('[data-close="productModal"]').addEventListener('click', () => {
      document.getElementById('productModal').style.display = 'none';
    });

    document.getElementById('addProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('productError');
      errEl.textContent = '';

      try {
        await api.post('/inventory/products', {
          name: document.getElementById('prodName').value,
          sku: document.getElementById('prodSku').value,
          barcode: document.getElementById('prodBarcode').value || undefined,
          category: document.getElementById('prodCategory').value,
          price: {
            mrp: parseFloat(document.getElementById('prodMrp').value),
            sellingPrice: parseFloat(document.getElementById('prodSelling').value),
            costPrice: parseFloat(document.getElementById('prodCost').value),
          },
          stock: {
            current: parseInt(document.getElementById('prodStock').value) || 0,
            minimum: 5,
            maximum: 1000,
          },
          unit: document.getElementById('prodUnit').value,
          gstRate: parseInt(document.getElementById('prodGst').value),
        });

        document.getElementById('productModal').style.display = 'none';
        document.getElementById('addProductForm').reset();
        app.showToast('Product added!', 'success');
        this.load();
      } catch (error) {
        errEl.textContent = error.message;
      }
    });

    // Search
    let searchTimeout;
    document.getElementById('inventorySearch').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.load(e.target.value), 300);
    });
  },

  async load(search = '') {
    try {
      const query = search ? `&search=${encodeURIComponent(search)}` : '';
      const result = await api.get(`/inventory/products?limit=20${query}`);
      const tbody = document.getElementById('inventoryBody');

      if (!result?.data?.products?.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No products found</td></tr>';
        return;
      }

      tbody.innerHTML = result.data.products.map(p => {
        const isLow = p.stock?.current <= p.stock?.minimum;
        const isOut = p.stock?.current === 0;
        const stockClass = isOut ? 'color:var(--danger);font-weight:700' : isLow ? 'color:var(--warning);font-weight:700' : '';

        return `
          <tr>
            <td>
              <div style="font-weight:600">${p.name}</div>
              ${p.barcode ? `<div style="font-size:0.7rem;color:var(--text-muted)">📊 ${p.barcode}</div>` : ''}
            </td>
            <td style="font-family:monospace;font-size:0.8rem">${p.sku}</td>
            <td style="font-weight:600">₹${(p.price?.sellingPrice || 0).toFixed(2)}</td>
            <td style="${stockClass}">${p.stock?.current || 0} ${p.unit || ''}</td>
            <td><span class="status status-active">${p.category}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="inventory.stockIn('${p._id}')">+Stock</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.warn('Inventory load error:', error.message);
    }
  },

  async stockIn(productId) {
    const qty = prompt('Enter stock-in quantity:');
    if (!qty || isNaN(qty)) return;

    try {
      await api.post('/inventory/stock', {
        productId,
        quantity: parseInt(qty),
        action: 'STOCK_IN',
        reason: 'Manual stock in from dashboard',
      });
      app.showToast('Stock updated!', 'success');
      this.load();
    } catch (error) {
      app.showToast(error.message, 'error');
    }
  },
};
