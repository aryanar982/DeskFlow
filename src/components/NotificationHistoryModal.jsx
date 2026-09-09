import React, { useState, useEffect } from 'react';
import { Bell, X, Trash2, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { getNotificationHistory, clearNotificationHistory, showNotification } from '../services/notifications';

export function NotificationHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getNotificationHistory());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    clearNotificationHistory();
    setHistory([]);
  };

  const handleSendTest = () => {
    showNotification('DeskFlow Test Alert 🔔', 'Native Windows notification is active and working!');
    setHistory(getNotificationHistory());
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-shortcuts animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={15} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="modal-title">Notification History</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 10px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {history.length} logged alert{history.length !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: 10, padding: '3px 8px' }}
              onClick={handleSendTest}
            >
              Test Alert
            </button>
            {history.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: 10, padding: '3px 8px', color: '#ef4444' }}
                onClick={handleClear}
              >
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="notif-history-list">
          {history.length === 0 ? (
            <div className="empty-history-state">
              <Bell size={20} style={{ opacity: 0.35, margin: '0 auto 6px' }} />
              <p>No notifications yet.</p>
              <span>Task reminders, Pomodoro alerts, and completion chimes will log here.</span>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="notif-history-item">
                <div className="notif-history-icon">
                  <Info size={12} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div className="notif-history-content">
                  <div className="notif-history-title-row">
                    <span className="notif-history-title">{item.title}</span>
                    <span className="notif-history-time">{formatTimestamp(item.timestamp)}</span>
                  </div>
                  <div className="notif-history-body">{item.body}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
