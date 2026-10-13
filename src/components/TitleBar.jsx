import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Pin,
  PinOff
} from 'lucide-react';

export function TitleBar({
  onOpenSettings,
  isLocked = false,
  children
}) {
  const [isPinned, setIsPinned] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkPinned = async () => {
      if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
        const pinned = await window.deskflowAPI.windowControl.isPinned();
        if (mounted) setIsPinned(pinned);
      }
    };
    checkPinned();
    return () => { mounted = false; };
  }, []);

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      window.deskflowAPI.windowControl.minimize();
    }
  };

  const handleTogglePin = async () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      const newState = await window.deskflowAPI.windowControl.togglePin();
      setIsPinned(newState);
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

        {/* Window control: Always on Top */}
        <button
          className={`titlebar-btn ${isPinned ? 'active' : ''}`}
          onClick={handleTogglePin}
          title={isPinned ? "Remove Always on Top" : "Always on Top"}
          id="titlebar-pin-btn"
        >
          {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
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
