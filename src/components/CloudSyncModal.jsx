import React, { useState, useRef } from 'react';
import {
  X,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Upload,
  Download,
  Trash2,
  RotateCcw,
  Check,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  Sliders,
  ExternalLink,
  Laptop,
  Wifi,
  WifiOff,
} from 'lucide-react';

export function CloudSyncModal({
  isOpen,
  onClose,
  cloudSync,
  onRestoreState, // Callback to refresh App state after a backup is restored
}) {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'backups' | 'audit'
  const [newBackupLabel, setNewBackupLabel] = useState('');
  const [restoreConfirmId, setRestoreConfirmId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const {
    isOnline,
    account,
    syncStatus,
    isSyncing,
    backups,
    prefs,
    pendingChangesCount,
    auditLogs,
    lastSyncedAt,
    connectAccount,
    disconnectAccount,
    syncNow,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackupFile,
    importBackupFile,
    updatePrefs,
  } = cloudSync;

  const showToast = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3200);
  };

  const handleSyncNow = async () => {
    try {
      await syncNow();
      showToast('☁️ Cloud synchronization completed successfully!');
    } catch (err) {
      showToast(`⚠️ Sync failed: ${err.message}`);
    }
  };

  const handleCreateSnapshot = (e) => {
    e.preventDefault();
    const label = newBackupLabel.trim() || `Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    createBackup(label);
    setNewBackupLabel('');
    showToast(`✅ Created backup snapshot: "${label}"`);
  };

  const handleConfirmRestore = (id) => {
    try {
      const restoredData = restoreBackup(id);
      setRestoreConfirmId(null);
      if (onRestoreState) onRestoreState(restoredData);
      showToast('🔄 Restored version successfully! (Safety snapshot preserved)');
    } catch (err) {
      showToast(`⚠️ Restore failed: ${err.message}`);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const imported = importBackupFile(text);
          if (onRestoreState) onRestoreState(imported);
          showToast(`📦 Backup imported successfully (${imported.tasks?.length || 0} tasks).`);
        }
      } catch (err) {
        showToast(`⚠️ Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatLastSync = (ts) => {
    if (!ts) return 'Never';
    const diffSec = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog modal-cloud animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '460px', width: '94%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #0284c7, #0078d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Cloud size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 className="modal-title" style={{ fontSize: 13, fontWeight: 700 }}>
                  Cloud Sync & Backups
                </h2>
                {/* Real-time Status Badge */}
                <span className={`sync-status-badge ${syncStatus}`}>
                  {syncStatus === 'synced' && <CloudCheck size={10} />}
                  {syncStatus === 'syncing' && <RefreshCw size={10} className="spin" />}
                  {syncStatus === 'offline' && <CloudOff size={10} />}
                  {syncStatus === 'disconnected' && <Laptop size={10} />}
                  <span>
                    {syncStatus === 'synced'
                      ? 'Synced'
                      : syncStatus === 'syncing'
                      ? 'Syncing...'
                      : syncStatus === 'offline'
                      ? 'Offline Mode'
                      : 'Local Only'}
                  </span>
                </span>
              </div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', margin: 0 }}>
                Cross-device synchronization & automated snapshot rollbacks
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="cloud-tabs-nav">
          <button
            type="button"
            className={`cloud-nav-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('accounts')}
          >
            <Cloud size={12} /> Cloud Accounts
          </button>
          <button
            type="button"
            className={`cloud-nav-tab ${activeTab === 'backups' ? 'active' : ''}`}
            onClick={() => setActiveTab('backups')}
          >
            <Shield size={12} /> Backups & Restore ({backups.length})
          </button>
          <button
            type="button"
            className={`cloud-nav-tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Clock size={12} /> Sync Log
          </button>
        </div>

        {/* Toast Feedback Banner */}
        {actionMessage && (
          <div className="cloud-toast-banner animate-fade-in">
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="cloud-modal-body">
          {/* TAB 1: CLOUD ACCOUNTS & SYNC */}
          {activeTab === 'accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Network Connectivity Status Bar */}
              <div className={`network-banner ${isOnline ? 'online' : 'offline'}`}>
                {isOnline ? (
                  <>
                    <Wifi size={13} className="text-success" />
                    <span>Connected to Internet — Cloud synchronization operational.</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={13} className="text-warning" />
                    <span>
                      Offline Mode Active — {pendingChangesCount} changes queued for sync upon reconnection.
                    </span>
                  </>
                )}
              </div>

              {/* Active Account Card (if connected) */}
              {account ? (
                <div className="active-account-card">
                  <div className="active-account-top">
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="account-avatar"
                      onError={(e) => {
                        e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=DeskFlowUser';
                      }}
                    />
                    <div className="account-details">
                      <div className="account-name-row">
                        <strong className="account-name">{account.name}</strong>
                        <span className="account-provider-tag">{account.providerName}</span>
                      </div>
                      <span className="account-email">{account.email}</span>
                      <span className="account-last-sync">
                        Last synced: <strong>{formatLastSync(lastSyncedAt)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="active-account-actions">
                    <button
                      className="cloud-btn-primary"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                    >
                      <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                    <button
                      className="cloud-btn-secondary"
                      onClick={disconnectAccount}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                /* Connect Providers Grid */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span className="cloud-section-label">Connect a Cloud Account</span>

                  {/* Google */}
                  <div className="provider-card google-card">
                    <div className="provider-info-col">
                      <div className="provider-title-row">
                        <span className="provider-badge google-badge">G</span>
                        <strong className="provider-name">Google Drive Sync</strong>
                      </div>
                      <span className="provider-desc">
                        Synchronize tasks, notes & layouts via Google Cloud securely.
                      </span>
                    </div>
                    <button
                      className="provider-connect-btn google-btn"
                      onClick={() => connectAccount('google')}
                    >
                      Connect
                    </button>
                  </div>

                  {/* Microsoft */}
                  <div className="provider-card ms-card">
                    <div className="provider-info-col">
                      <div className="provider-title-row">
                        <span className="provider-badge ms-badge">M</span>
                        <strong className="provider-name">Microsoft OneDrive Sync</strong>
                      </div>
                      <span className="provider-desc">
                        Sync seamlessly with Microsoft 365 and Windows Roaming Profiles.
                      </span>
                    </div>
                    <button
                      className="provider-connect-btn ms-btn"
                      onClick={() => connectAccount('microsoft')}
                    >
                      Connect
                    </button>
                  </div>

                  {/* GitHub */}
                  <div className="provider-card github-card">
                    <div className="provider-info-col">
                      <div className="provider-title-row">
                        <span className="provider-badge github-badge">GH</span>
                        <strong className="provider-name">GitHub Cloud Sync</strong>
                      </div>
                      <span className="provider-desc">
                        Store encrypted configuration in GitHub Gists with git versioning.
                      </span>
                    </div>
                    <button
                      className="provider-connect-btn github-btn"
                      onClick={() => connectAccount('github')}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}

              {/* Granular Sync Controls */}
              <div className="cloud-preferences-box">
                <span className="cloud-section-label">Synchronized Items</span>
                <div className="sync-toggles-grid">
                  <label className="sync-toggle-row">
                    <input
                      type="checkbox"
                      checked={prefs.syncTasks}
                      onChange={(e) => updatePrefs({ syncTasks: e.target.checked })}
                    />
                    <div className="sync-toggle-text">
                      <strong>Tasks & Subtasks</strong>
                      <span>Priorities, tags, attachments, recurrence</span>
                    </div>
                  </label>

                  <label className="sync-toggle-row">
                    <input
                      type="checkbox"
                      checked={prefs.syncSettings}
                      onChange={(e) => updatePrefs({ syncSettings: e.target.checked })}
                    />
                    <div className="sync-toggle-text">
                      <strong>Theme & Visual Styling</strong>
                      <span>Colors, fonts, corner radius, glass blur</span>
                    </div>
                  </label>

                  <label className="sync-toggle-row">
                    <input
                      type="checkbox"
                      checked={prefs.syncNotes}
                      onChange={(e) => updatePrefs({ syncNotes: e.target.checked })}
                    />
                    <div className="sync-toggle-text">
                      <strong>Sticky Notes & Scratchpad</strong>
                      <span>Color notes and daily thoughts</span>
                    </div>
                  </label>

                  <label className="sync-toggle-row">
                    <input
                      type="checkbox"
                      checked={prefs.syncShortcuts}
                      onChange={(e) => updatePrefs({ syncShortcuts: e.target.checked })}
                    />
                    <div className="sync-toggle-text">
                      <strong>Quick Launch Shortcuts</strong>
                      <span>Apps, URLs and desktop launcher deck</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKUPS & RESTORE HISTORY */}
          {activeTab === 'backups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Create Snapshot Form */}
              <form onSubmit={handleCreateSnapshot} className="create-snapshot-form">
                <input
                  type="text"
                  placeholder="Snapshot label (e.g. Before Major Sprint...)"
                  value={newBackupLabel}
                  onChange={(e) => setNewBackupLabel(e.target.value)}
                  className="snapshot-input"
                />
                <button type="submit" className="cloud-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  <Shield size={12} /> Save Snapshot
                </button>
              </form>

              {/* Automatic Backup Interval Settings */}
              <div className="auto-backup-strip">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="auto-backup-chk"
                    checked={prefs.autoBackupEnabled}
                    onChange={(e) => updatePrefs({ autoBackupEnabled: e.target.checked })}
                  />
                  <label htmlFor="auto-backup-chk" style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Automatic Backup Schedule
                  </label>
                </div>
                <select
                  value={prefs.autoBackupInterval}
                  onChange={(e) => updatePrefs({ autoBackupInterval: Number(e.target.value) })}
                  className="auto-backup-select"
                  disabled={!prefs.autoBackupEnabled}
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={60}>Every 1 hour</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={1440}>Every 24 hours</option>
                </select>
              </div>

              {/* File Export / Import Actions */}
              <div className="backup-file-actions-row">
                <button
                  type="button"
                  className="backup-tool-btn"
                  onClick={exportBackupFile}
                  title="Export full workspace data to JSON file"
                >
                  <Download size={12} />
                  <span>Export JSON File</span>
                </button>

                <button
                  type="button"
                  className="backup-tool-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import previously saved JSON file"
                >
                  <Upload size={12} />
                  <span>Import JSON File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              {/* Version History List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="cloud-section-label">Previous Versions & Snapshots</span>

                {backups.length === 0 ? (
                  <div className="empty-backups-state">
                    <Shield size={24} style={{ opacity: 0.35, marginBottom: 4 }} />
                    <p>No previous version snapshots saved.</p>
                    <span>Create your first snapshot above or enable auto-backups.</span>
                  </div>
                ) : (
                  <div className="backups-list-container">
                    {backups.map((bkp) => (
                      <div key={bkp.id} className="backup-version-item">
                        <div className="backup-item-left">
                          <div className="backup-item-title-row">
                            <strong className="backup-item-label">{bkp.label}</strong>
                            <span className="backup-item-time">
                              {bkp.dateStr} • {bkp.timeStr}
                            </span>
                          </div>
                          <div className="backup-item-stats">
                            <span className="stat-pill">{bkp.stats?.taskCount || 0} tasks</span>
                            <span className="stat-pill">{bkp.stats?.shortcutsCount || 0} shortcuts</span>
                            {bkp.stats?.noteLength > 0 && (
                              <span className="stat-pill">Notes</span>
                            )}
                          </div>
                        </div>

                        <div className="backup-item-actions">
                          {restoreConfirmId === bkp.id ? (
                            <div className="restore-confirm-box">
                              <span style={{ fontSize: 9.5, color: '#f59e0b', fontWeight: 600 }}>Restore now?</span>
                              <button
                                className="confirm-yes-btn"
                                onClick={() => handleConfirmRestore(bkp.id)}
                              >
                                Yes
                              </button>
                              <button
                                className="confirm-no-btn"
                                onClick={() => setRestoreConfirmId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                className="backup-restore-btn"
                                onClick={() => setRestoreConfirmId(bkp.id)}
                                title="Restore this version (Safety snapshot will be created first)"
                              >
                                <RotateCcw size={11} />
                                <span>Restore</span>
                              </button>
                              <button
                                className="backup-delete-btn"
                                onClick={() => deleteBackup(bkp.id)}
                                title="Delete this version snapshot"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITY & AUDIT LOG */}
          {activeTab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="cloud-section-label">Audit & Sync Event Stream</span>
                {auditLogs.length > 0 && (
                  <button
                    className="clear-logs-btn"
                    onClick={() => cloudSync.cloudSyncService?.clearAuditLogs()}
                  >
                    Clear History
                  </button>
                )}
              </div>

              {auditLogs.length === 0 ? (
                <div className="empty-backups-state">
                  <Clock size={22} style={{ opacity: 0.35, marginBottom: 4 }} />
                  <p>No sync events recorded yet.</p>
                </div>
              ) : (
                <div className="audit-log-stream">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="audit-log-item">
                      <span className={`log-indicator-dot ${log.success ? 'success' : 'warn'}`} />
                      <div className="log-text-col">
                        <span className="log-message">{log.message}</span>
                        <span className="log-meta">
                          {log.dateFormatted} at {log.timeFormatted}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
