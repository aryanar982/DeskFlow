import React, { useState } from 'react';
import {
  Pin,
  Settings,
  Minus,
  X,
  Layout,
  Minimize2,
  Maximize2,
  Ghost,
  AlignRight,
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';

export function TitleBar({
  alwaysOnTop,
  onTogglePin,
  onOpenSettings,
  onToggleCompactMode,
  isCompactMode = false,
  isClickThrough,
  onToggleClickThrough,
  onSnapToRight,
  onOpenCloudSync,
  syncStatus = 'disconnected',
  isOnline = true,
}) {
  const [showUtilities, setShowUtilities] = useState(false);

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      window.deskflowAPI.windowControl.minimize();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      window.deskflowAPI.windowControl.close();
    }
  };

  const handleSnap = () => {
    setShowUtilities(false);
    if (onSnapToRight) {
      onSnapToRight();
    } else if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.snapTo) {
      window.deskflowAPI.windowControl.snapTo('top-right');
    }
  };

  return (
    <div className={`titlebar drag-region ${isCompactMode ? 'is-compact-titlebar' : ''}`}>
      <div className="titlebar-brand no-drag">
        <div className="titlebar-logo-icon">
          <Layout size={12} strokeWidth={2.5} />
        </div>
        <span className="titlebar-brand-text">DeskFlow</span>
        {isCompactMode && <span className="titlebar-mode-badge">Compact</span>}
      </div>

      <div className="titlebar-controls no-drag">
        {/* Full Mode: Show Snap & Ghost directly */}
        {!isCompactMode && (
          <>
            <button
              className="titlebar-btn"
              onClick={handleSnap}
              title="Snap to Screen Edge"
            >
              <AlignRight size={13} />
            </button>

            <button
              className={`titlebar-btn ${isClickThrough ? 'active' : ''}`}
              onClick={onToggleClickThrough}
              title={isClickThrough ? 'Click-Through Mode: ON (Alt+C)' : 'Click-Through Ghost Mode (Alt+C)'}
            >
              <Ghost size={13} />
            </button>
          </>
        )}

        {/* Compact Mode: Secondary utilities popover */}
        {isCompactMode && (
          <div style={{ position: 'relative' }}>
            <button
              className={`titlebar-btn ${showUtilities ? 'active' : ''}`}
              onClick={() => setShowUtilities(!showUtilities)}
              title="Window Utilities (Snap, Ghost Mode)"
            >
              <MoreHorizontal size={13} />
            </button>

            {showUtilities && (
              <div
                className="titlebar-utilities-popover animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="popover-action-row"
                  onClick={handleSnap}
                >
                  <AlignRight size={12} />
                  <span>Snap to Edge</span>
                </button>
                <button
                  className={`popover-action-row ${isClickThrough ? 'active' : ''}`}
                  onClick={() => {
                    if (onToggleClickThrough) onToggleClickThrough();
                    setShowUtilities(false);
                  }}
                >
                  <Ghost size={12} />
                  <span>{isClickThrough ? 'Exit Ghost Mode' : 'Ghost Mode (Alt+C)'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cloud Sync & Backups Icon */}
        {onOpenCloudSync && (
          <button
            className={`titlebar-btn ${syncStatus === 'syncing' ? 'active' : ''}`}
            onClick={onOpenCloudSync}
            title={
              !isOnline
                ? 'Offline Mode — Changes Queued'
                : syncStatus === 'synced'
                ? 'Cloud Sync: Active & Up to Date'
                : syncStatus === 'syncing'
                ? 'Cloud Sync: Synchronizing...'
                : 'Cloud Sync & Backups'
            }
            style={{ position: 'relative' }}
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw size={12} className="spin" style={{ color: 'var(--accent-primary)' }} />
            ) : !isOnline ? (
              <CloudOff size={12} style={{ color: '#f59e0b' }} />
            ) : syncStatus === 'synced' ? (
              <CloudCheck size={12} style={{ color: '#10b981' }} />
            ) : (
              <Cloud size={12} />
            )}
            {syncStatus === 'synced' && (
              <span
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
            )}
          </button>
        )}

        {/* Always on top pin */}
        <button
          className={`titlebar-btn ${alwaysOnTop ? 'active' : ''}`}
          onClick={onTogglePin}
          title={alwaysOnTop ? 'Always on Top: ON' : 'Always on Top: OFF'}
        >
          <Pin size={12} style={{ transform: alwaysOnTop ? 'rotate(45deg)' : 'none' }} />
        </button>

        {/* Responsive Compact / Large Mode Switch */}
        {onToggleCompactMode && (
          <button
            className={`titlebar-btn ${isCompactMode ? 'mode-compact' : ''}`}
            onClick={onToggleCompactMode}
            title={isCompactMode ? 'Expand to Large Layout (Alt+M)' : 'Switch to Compact Mode (Alt+M)'}
          >
            {isCompactMode ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        )}

        {/* Settings */}
        <button
          className="titlebar-btn"
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={13} />
        </button>

        {/* Window control: Minimize */}
        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          title="Minimize"
        >
          <Minus size={13} />
        </button>

        {/* Window control: Close */}
        <button
          className="titlebar-btn close"
          onClick={handleClose}
          title="Close Widget"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

