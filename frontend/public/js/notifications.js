/**
 * Notifications Module
 */

const notifications = {
  init() {
    document.getElementById('markAllReadBtn').addEventListener('click', async () => {
      try {
        await api.patch('/notifications/read-all');
        app.showToast('All marked as read', 'success');
        this.load();
        this.updateBadge();
      } catch (error) {
        app.showToast(error.message, 'error');
      }
    });
  },

  async load() {
    try {
      const result = await api.get('/notifications?limit=50');
      const container = document.getElementById('notificationList');

      if (!result?.data?.notifications?.length) {
        container.innerHTML = '<div class="empty-state">No notifications</div>';
        return;
      }

      container.innerHTML = result.data.notifications.map(n => `
        <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="notifications.markRead('${n.id}', this)">
          <div>
            <div class="notif-title">${n.title}</div>
            <div class="notif-message">${n.message}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleString('en-IN')}</div>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.warn('Notifications load error:', error.message);
    }
  },

  async markRead(id, el) {
    try {
      await api.patch(`/notifications/${id}/read`);
      if (el) el.classList.remove('unread');
      this.updateBadge();
    } catch (error) {
      console.warn('Mark read error:', error.message);
    }
  },

  async updateBadge() {
    try {
      const result = await api.get('/notifications/unread-count');
      const badge = document.getElementById('notifBadge');
      const count = result?.data?.unreadCount || 0;

      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch {
      // Silent
    }
  },
};
