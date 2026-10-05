import React from 'react';
import {
  Settings,
  X,
} from 'lucide-react';

export function TitleBar({
  onOpenSettings,
  isLocked = false,
  children
}) {
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

  return (
    <div
      className={`titlebar ${isLocked ? 'no-drag is-locked' : 'drag-region'}`}
    >
      <div className="titlebar-left no-drag" style={{ display: 'flex', alignItems: 'center' }}>
        {children}
      </div>

      <div className="titlebar-drag-spacer" style={{ flex: 1, minHeight: '1px' }} />

      <div className="titlebar-controls no-drag">
        {/* Settings */}
        <button
          className="titlebar-btn"
          onClick={onOpenSettings}
          title="Settings"
          id="titlebar-settings-btn"
        >
          <Settings size={13} />
        </button>

        {/* Window control: Close */}
        <button
          className="titlebar-btn close"
          onClick={handleClose}
          title="Close Widget"
          id="titlebar-close-btn"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
