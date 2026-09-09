import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudSyncService } from '../services/cloudSyncService';
import { showNotification } from '../services/notifications';

export function useCloudSync(localDataSnapshot = {}) {
  const [isOnline, setIsOnline] = useState(() => cloudSyncService.isOnline());
  const [account, setAccount] = useState(() => cloudSyncService.getAccount());
  const [backups, setBackups] = useState(() => cloudSyncService.getBackups());
  const [prefs, setPrefs] = useState(() => cloudSyncService.getPrefs());
  const [queue, setQueue] = useState(() => cloudSyncService.getQueue());
  const [auditLogs, setAuditLogs] = useState(() => cloudSyncService.getAuditLogs());
  const [syncStatus, setSyncStatus] = useState(() => {
    if (!cloudSyncService.isOnline()) return 'offline';
    return cloudSyncService.getAccount() ? 'synced' : 'disconnected';
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const localDataRef = useRef(localDataSnapshot);
  useEffect(() => {
    localDataRef.current = localDataSnapshot;
  }, [localDataSnapshot]);

  // Subscribe to service changes
  useEffect(() => {
    const unsubscribe = cloudSyncService.subscribe(() => {
      setAccount(cloudSyncService.getAccount());
      setBackups(cloudSyncService.getBackups());
      setPrefs(cloudSyncService.getPrefs());
      setQueue(cloudSyncService.getQueue());
      setAuditLogs(cloudSyncService.getAuditLogs());
    });
    return unsubscribe;
  }, []);

  // Online / Offline Window Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const acc = cloudSyncService.getAccount();
      if (acc) {
        setSyncStatus('syncing');
        // Auto flush offline queue
        cloudSyncService
          .syncNow(localDataRef.current)
          .then(() => {
            setSyncStatus('synced');
            showNotification('Back Online! ☁️', 'All offline changes synchronized with your cloud account.');
          })
          .catch(() => setSyncStatus('error'));
      } else {
        setSyncStatus('disconnected');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      showNotification('Offline Mode Active 📡', 'Changes will be queued safely and synced when reconnected.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-backup interval scheduler
  useEffect(() => {
    if (!prefs.autoBackupEnabled || !prefs.autoBackupInterval) return;

    const intervalMs = Math.max(5, prefs.autoBackupInterval) * 60 * 1000;
    const timer = setInterval(() => {
      try {
        cloudSyncService.createBackup('Auto-Scheduled Backup', localDataRef.current);
      } catch (err) {
        console.warn('Auto backup cycle skipped', err);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [prefs.autoBackupEnabled, prefs.autoBackupInterval]);

  // Connect Account
  const connectAccount = useCallback((provider, customEmail) => {
    const acc = cloudSyncService.connectAccount(provider, customEmail);
    setAccount(acc);
    setSyncStatus(isOnline ? 'synced' : 'offline');
    // Initial sync
    if (isOnline) {
      setIsSyncing(true);
      cloudSyncService
        .syncNow(localDataRef.current)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'))
        .finally(() => setIsSyncing(false));
    }
    return acc;
  }, [isOnline]);

  // Disconnect Account
  const disconnectAccount = useCallback(() => {
    cloudSyncService.disconnectAccount();
    setAccount(null);
    setSyncStatus('disconnected');
  }, []);

  // Manual Sync Now
  const syncNow = useCallback(async () => {
    if (!account) return { status: 'disconnected' };
    if (!isOnline) {
      setSyncStatus('offline');
      cloudSyncService.enqueueOfflineChange('manual_sync', { timestamp: Date.now() });
      return { status: 'offline' };
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      const res = await cloudSyncService.syncNow(localDataRef.current);
      setSyncStatus('synced');
      return res;
    } catch (err) {
      setSyncStatus('error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [account, isOnline]);

  // Create Snapshot
  const createBackup = useCallback((label = 'Manual Snapshot') => {
    return cloudSyncService.createBackup(label, localDataRef.current);
  }, []);

  // Restore Snapshot
  const restoreBackup = useCallback((backupId) => {
    return cloudSyncService.restoreBackup(backupId, localDataRef.current);
  }, []);

  // Delete Snapshot
  const deleteBackup = useCallback((backupId) => {
    return cloudSyncService.deleteBackup(backupId);
  }, []);

  // Export File
  const exportBackupFile = useCallback(() => {
    return cloudSyncService.exportBackupFile(localDataRef.current);
  }, []);

  // Import File
  const importBackupFile = useCallback((jsonString) => {
    return cloudSyncService.importBackupFile(jsonString, localDataRef.current);
  }, []);

  // Update Preferences
  const updatePrefs = useCallback((partial) => {
    return cloudSyncService.setPrefs(partial);
  }, []);

  return {
    isOnline,
    account,
    syncStatus,
    isSyncing,
    backups,
    prefs,
    queue,
    pendingChangesCount: queue.length,
    auditLogs,
    lastSyncedAt: account?.lastSyncedAt || null,
    // Actions
    connectAccount,
    disconnectAccount,
    syncNow,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackupFile,
    importBackupFile,
    updatePrefs,
  };
}
