const NOTIF_STORAGE_KEY = 'deskflow_notif_history_v1';

export function playChime(type = 'complete') {
  // Sound effects have been globally disabled as per user request.
  return;
}

// Notification History Management
export function getNotificationHistory() {
  try {
    const data = localStorage.getItem(NOTIF_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveNotificationToHistory(entry) {
  try {
    const history = getNotificationHistory();
    const updated = [
      {
        id: 'notif-' + Date.now(),
        timestamp: Date.now(),
        ...entry,
      },
      ...history.slice(0, 49), // Keep last 50
    ];
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to log notification history', err);
    return [];
  }
}

export function clearNotificationHistory() {
  try {
    localStorage.removeItem(NOTIF_STORAGE_KEY);
  } catch {}
}

export function showNotification(title, body, extra = {}) {
  try {
    // Log to history
    saveNotificationToHistory({
      title: title || 'DeskFlow',
      body: body || '',
      taskId: extra.taskId || null,
      type: extra.type || 'info',
    });

    if (typeof window !== 'undefined' && window.deskflowAPI?.notify) {
      if (extra.interactive && window.deskflowAPI.notify.showInteractive) {
        window.deskflowAPI.notify.showInteractive({
          title,
          body,
          taskId: extra.taskId,
        });
        return;
      }
      window.deskflowAPI.notify.show(title, body);
      return;
    }

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  } catch (err) {
    console.error('Notification error', err);
  }
}
