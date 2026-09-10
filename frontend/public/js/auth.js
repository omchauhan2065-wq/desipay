/**
 * Auth Module — Login & Register
 */

const auth = {
  init() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isLogin = tab.dataset.tab === 'login';
        document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
        document.getElementById('registerForm').style.display = isLogin ? 'none' : 'block';
      });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('loginError');
      errEl.textContent = '';

      try {
        const result = await api.post('/auth/login', {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value,
        });

        if (result.data?.accessToken) {
          api.setToken(result.data.accessToken);
          app.onLogin(result.data.user);
          app.showToast('Login successful!', 'success');
        } else if (result.data?.mfaRequired) {
          errEl.textContent = 'MFA required — use the API directly for now';
        }
      } catch (error) {
        errEl.textContent = error.message;
      }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('registerError');
      errEl.textContent = '';

      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirm').value;

      if (password !== confirm) {
        errEl.textContent = 'Passwords do not match';
        return;
      }

      try {
        const result = await api.post('/auth/register', {
          fullName: document.getElementById('regName').value,
          email: document.getElementById('regEmail').value,
          phone: document.getElementById('regPhone').value,
          password,
          confirmPassword: confirm,
          role: document.getElementById('regRole').value,
        });

        if (result.data?.accessToken) {
          api.setToken(result.data.accessToken);
          app.onLogin(result.data.user);
          app.showToast('Account created!', 'success');
        }
      } catch (error) {
        errEl.textContent = error.message;
      }
    });
  },
};
