const NOTIF_STORAGE_KEY = 'deskflow_notif_history_v1';

// Modern synthesized Windows 11 chime via Web Audio API
export function playChime(type = 'complete') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'complete') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.16); // D6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } else if (type === 'pomo') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    }
  } catch (err) {
    console.error('Audio playback error', err);
  }
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
