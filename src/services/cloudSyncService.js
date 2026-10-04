import { getLocalDateString } from '../utils/dateUtils';
import { storage } from './storage';

const STORAGE_KEYS = {
  ACCOUNT: 'deskflow_cloud_account_v1',
  BACKUPS: 'deskflow_cloud_backups_v1',
  PREFS: 'deskflow_cloud_sync_prefs_v1',
  QUEUE: 'deskflow_cloud_offline_queue_v1',
  AUDIT: 'deskflow_cloud_audit_log_v1',
  REMOTE_STORE: 'deskflow_cloud_remote_mock_v1',
};

const DEFAULT_PREFS = {
  syncTasks: true,
  syncSettings: true,
  syncThemes: true,
  syncNotes: true,
  syncShortcuts: true,
  autoBackupEnabled: true,
  autoBackupInterval: 60, // minutes (e.g. 15, 60, 360, 1440)
  maxBackupRetention: 15,
};

const PROVIDER_PROFILES = {
  google: {
    id: 'google',
    name: 'Google Drive Sync',
    service: 'Google Cloud Platform',
    iconColor: '#ea4335',
    defaultEmail: 'user.flow@gmail.com',
    defaultName: 'User (Google)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoogleUser',
  },
  microsoft: {
    id: 'microsoft',
    name: 'Microsoft OneDrive Sync',
    service: 'Microsoft Graph & 365',
    iconColor: '#0078d4',
    defaultEmail: 'user@live.com',
    defaultName: 'User (Microsoft)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MicrosoftUser',
  },
  github: {
    id: 'github',
    name: 'GitHub Gist Cloud Sync',
    service: 'GitHub API & Encrypted Gists',
    iconColor: '#2ea44f',
    defaultEmail: 'user@github.com',
    defaultName: 'User (GitHub)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GitHubUser',
  },
};

// Event listener subscribers for real-time reactivity across components
const listeners = new Set();
function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in cloud sync subscriber', e);
    }
  });
}

export const cloudSyncService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ----------------------------------------------------------------------
  // Network Status
  // ----------------------------------------------------------------------
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  },

  // ----------------------------------------------------------------------
  // Account Management
  // ----------------------------------------------------------------------
  getAccount() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNT);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  connectAccount(providerKey, customEmail = null) {
    const profile = PROVIDER_PROFILES[providerKey] || PROVIDER_PROFILES.google;
    const email = customEmail || profile.defaultEmail;

    const account = {
      provider: profile.id,
      providerName: profile.name,
      service: profile.service,
      email,
      name: profile.defaultName,
      avatar: profile.avatar,
      connectedAt: Date.now(),
      lastSyncedAt: null,
      tokenExpiresAt: Date.now() + 86400000 * 30, // 30 days valid
      status: 'connected',
    };

    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));
    this.addAuditLog('account_connected', `Connected to ${profile.name} (${email})`, true);
    notifyListeners();
    return account;
  },

  disconnectAccount() {
    const prev = this.getAccount();
    localStorage.removeItem(STORAGE_KEYS.ACCOUNT);
    this.addAuditLog('account_disconnected', `Disconnected account ${prev ? prev.email : ''}`, true);
    notifyListeners();
  },

  // ----------------------------------------------------------------------
  // Sync Preferences
  // ----------------------------------------------------------------------
  getPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  },

  setPrefs(prefs) {
    const merged = { ...this.getPrefs(), ...prefs };
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(merged));
    notifyListeners();
    return merged;
  },

  // ----------------------------------------------------------------------
  // Offline Sync Queue
  // ----------------------------------------------------------------------
  getQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  enqueueOfflineChange(type, payload) {
    const queue = this.getQueue();
    const entry = {
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      type, // 'task_updated' | 'setting_updated' | 'note_updated'
      payload,
    };
    queue.push(entry);
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
    notifyListeners();
  },

  clearQueue() {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify([]));
    notifyListeners();
  },

  // ----------------------------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------------------------
  getAuditLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addAuditLog(type, message, success = true) {
    const logs = this.getAuditLogs();
    const entry = {
      id: 'log-' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: getLocalDateString(),
      type,
      message,
      success,
    };
    const updated = [entry, ...logs].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    notifyListeners();
  },

  clearAuditLogs() {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    notifyListeners();
  },

  // ----------------------------------------------------------------------
  // Bi-Directional Cloud Synchronization
  // ----------------------------------------------------------------------
  async syncNow(localSnapshot) {
    const account = this.getAccount();
    if (!account) {
      throw new Error('No cloud account connected. Please connect Google, Microsoft, or GitHub.');
    }

    if (!this.isOnline()) {
      // Queue offline sync
      this.enqueueOfflineChange('manual_sync_attempt', { timestamp: Date.now() });
      this.addAuditLog('offline_sync', 'Offline mode active: changes queued for sync upon reconnection.', false);
      return { status: 'offline', queued: true };
    }

    // Simulate Cloud Network Roundtrip latency
    await new Promise((resolve) => setTimeout(resolve, 650));

    const prefs = this.getPrefs();

    // Prepare payload based on granular user preferences
    const syncPayload = {
      version: '4.5',
      syncedAt: Date.now(),
      syncedBy: account.email,
      provider: account.provider,
      data: {
        tasks: prefs.syncTasks ? localSnapshot.tasks || storage.getTasks() : null,
        settings: prefs.syncSettings ? localSnapshot.settings || storage.getSettings() : null,
        shortcuts: prefs.syncShortcuts ? localSnapshot.shortcuts || storage.getShortcuts() : null,
        notes: prefs.syncNotes ? localSnapshot.notes || storage.getNote() : null,
        focusHistory: localSnapshot.focusHistory || storage.getFocusHistory(),
      },
    };

    // Save to simulated remote cloud store for this account
    try {
      const allRemoteStores = JSON.parse(localStorage.getItem(STORAGE_KEYS.REMOTE_STORE) || '{}');
      allRemoteStores[account.provider] = syncPayload;
      localStorage.setItem(STORAGE_KEYS.REMOTE_STORE, JSON.stringify(allRemoteStores));
    } catch (err) {
      console.warn('Could not persist to simulated cloud remote', err);
    }

    // Flush any pending offline queue items
    const queue = this.getQueue();
    const flushedCount = queue.length;
    this.clearQueue();

    // Update account lastSyncedAt
    account.lastSyncedAt = Date.now();
    localStorage.setItem(STORAGE_KEYS.ACCOUNT, JSON.stringify(account));

    this.addAuditLog(
      'sync_success',
      `Synchronized with ${account.providerName} (${flushedCount} offline operations resolved).`,
      true
    );

    notifyListeners();

    return {
      status: 'success',
      syncedAt: account.lastSyncedAt,
      flushedCount,
      account,
    };
  },

  // ----------------------------------------------------------------------
  // Version Snapshots & Backups
  // ----------------------------------------------------------------------
  getBackups() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  createBackup(label = 'Manual Snapshot', localData = {}) {
    const backups = this.getBackups();
    const prefs = this.getPrefs();

    const tasks = localData.tasks || storage.getTasks();
    const settings = localData.settings || storage.getSettings();
    const shortcuts = localData.shortcuts || storage.getShortcuts();
    const notes = localData.notes || storage.getNote();
    const focusHistory = localData.focusHistory || storage.getFocusHistory();

    const newBackup = {
      id: 'bkp-' + Date.now(),
      timestamp: Date.now(),
      dateStr: getLocalDateString(),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label,
      stats: {
        taskCount: Array.isArray(tasks) ? tasks.length : 0,
        completedTaskCount: Array.isArray(tasks) ? tasks.filter((t) => t.completed).length : 0,
        shortcutsCount: Array.isArray(shortcuts) ? shortcuts.length : 0,
        noteLength: typeof notes === 'string' ? notes.length : 0,
      },
      data: {
        tasks,
        settings,
        shortcuts,
        notes,
        focusHistory,
      },
    };

    // Maintain max retention to keep storage efficient
    const updated = [newBackup, ...backups].slice(0, prefs.maxBackupRetention || 15);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(updated));

    this.addAuditLog('backup_created', `Snapshot created: "${label}" (${newBackup.stats.taskCount} tasks).`, true);
    notifyListeners();
    return newBackup;
  },

  restoreBackup(backupId, currentLocalData = {}) {
    const backups = this.getBackups();
    const target = backups.find((b) => b.id === backupId);
    if (!target || !target.data) {
      throw new Error(`Backup with ID ${backupId} was not found.`);
    }

    // Safety First: create an automatic rollback snapshot of current state before restoring
    this.createBackup('Safety Snapshot (Pre-Restore)', currentLocalData);

    const { tasks, settings, shortcuts, notes, focusHistory } = target.data;

    // Apply restore to persistent storage
    if (tasks) storage.setTasks(tasks);
    if (settings) storage.setSettings(settings);
    if (shortcuts) storage.setShortcuts(shortcuts);
    if (notes) storage.setNote(notes);
    if (focusHistory) storage.setFocusHistory(focusHistory);

    this.addAuditLog(
      'backup_restored',
      `Restored state to snapshot from ${target.dateStr} ${target.timeStr} ("${target.label}").`,
      true
    );

    notifyListeners();

    return target.data;
  },

  deleteBackup(backupId) {
    const backups = this.getBackups().filter((b) => b.id !== backupId);
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
    this.addAuditLog('backup_deleted', `Deleted backup version ${backupId}`, true);
    notifyListeners();
    return backups;
  },

  // ----------------------------------------------------------------------
  // Export & Import Snapshots (JSON File)
  // ----------------------------------------------------------------------
  exportBackupFile(localData = {}) {
    const payload = {
      app: 'DeskFlow Desktop Widget',
      version: '4.5',
      exportDate: new Date().toISOString(),
      tasks: localData.tasks || storage.getTasks(),
      settings: localData.settings || storage.getSettings(),
      shortcuts: localData.shortcuts || storage.getShortcuts(),
      notes: localData.notes || storage.getNote(),
      focusHistory: localData.focusHistory || storage.getFocusHistory(),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeskFlow-Full-Backup-${getLocalDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.addAuditLog('backup_exported', 'Exported full DeskFlow backup file (.json)', true);
  },

  importBackupFile(jsonString, currentLocalData = {}) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON backup format.');
      }

      // Pre-import safety snapshot
      this.createBackup('Safety Snapshot (Pre-Import)', currentLocalData);

      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        storage.setTasks(parsed.tasks);
      }
      if (parsed.settings && typeof parsed.settings === 'object') {
        storage.setSettings(parsed.settings);
      }
      if (parsed.shortcuts && Array.isArray(parsed.shortcuts)) {
        storage.setShortcuts(parsed.shortcuts);
      }
      if (typeof parsed.notes === 'string') {
        storage.setNote(parsed.notes);
      }
      if (parsed.focusHistory && Array.isArray(parsed.focusHistory)) {
        storage.setFocusHistory(parsed.focusHistory);
      }

      this.addAuditLog('backup_imported', `Imported backup file with ${parsed.tasks?.length || 0} tasks.`, true);
      notifyListeners();

      return parsed;
    } catch (err) {
      this.addAuditLog('backup_imported_failed', `Failed to import JSON: ${err.message}`, false);
      throw err;
    }
  },
};
