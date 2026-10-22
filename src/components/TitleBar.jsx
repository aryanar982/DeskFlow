import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  X,
  Pin,
  PinOff,
  Minus
} from 'lucide-react';
import { SnapLayoutsFlyout } from './SnapLayoutsFlyout';

export function TitleBar({
  onOpenSettings,
  isLocked = false,
  isMaximized = false,
  onToggleMaximize,
  children
}) {
  const [isPinned, setIsPinned] = useState(true);
  const [isSnapFlyoutOpen, setIsSnapFlyoutOpen] = useState(false);
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Keyboard shortcut listener: Alt + Z or Ctrl + Shift + Z toggles Snap Layouts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.altKey && e.key.toLowerCase() === 'z') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        setIsSnapFlyoutOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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

  const handleToggleMaximize = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsSnapFlyoutOpen(false);

    if (onToggleMaximize) {
      onToggleMaximize();
    } else if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.toggleMaximize) {
      window.deskflowAPI.windowControl.toggleMaximize();
    }
  };

  // Hover open behavior: 180ms delay before opening
  const handleMouseEnterBtn = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsSnapFlyoutOpen(true);
    }, 180);
  };

  const handleMouseLeaveBtn = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setIsSnapFlyoutOpen(false);
    }, 250);
  };

  const handleMouseEnterFlyout = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  };

  const handleMouseLeaveFlyout = () => {
    leaveTimerRef.current = setTimeout(() => {
      setIsSnapFlyoutOpen(false);
    }, 250);
  };

  const handleSnapZone = async (zone) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setIsSnapFlyoutOpen(false);

    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.snapToZone) {
      await window.deskflowAPI.windowControl.snapToZone(zone);
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

        {/* Window control: Minimize */}
        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          title="Minimize"
          id="titlebar-minimize-btn"
        >
          <Minus size={13} />
        </button>

        {/* Window control: Maximize / Snap Layouts Trigger */}
        <div
          className="titlebar-snap-wrapper"
          onMouseEnter={handleMouseEnterBtn}
          onMouseLeave={handleMouseLeaveBtn}
        >
          <button
            className={`titlebar-btn snap-btn ${isSnapFlyoutOpen ? 'snap-active' : ''}`}
            onClick={handleToggleMaximize}
            onContextMenu={(e) => {
              e.preventDefault();
              setIsSnapFlyoutOpen((prev) => !prev);
            }}
            title={isMaximized ? "Restore (Hover for Snap Layouts, Right-click to toggle)" : "Maximize (Hover for Snap Layouts, Right-click to toggle)"}
            id="titlebar-maximize-btn"
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" className="snap-icon-svg">
                <path fill="none" stroke="currentColor" strokeWidth="1" d="M2.5,2.5 L2.5,0.5 L9.5,0.5 L9.5,7.5 L7.5,7.5 M0.5,2.5 L7.5,2.5 L7.5,9.5 L0.5,9.5 Z"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" className="snap-icon-svg">
                <rect width="9" height="9" x="0.5" y="0.5" fill="none" stroke="currentColor" strokeWidth="1"/>
              </svg>
            )}
          </button>

          {isSnapFlyoutOpen && (
            <SnapLayoutsFlyout
              onSnapZone={handleSnapZone}
              onMouseEnter={handleMouseEnterFlyout}
              onMouseLeave={handleMouseLeaveFlyout}
              onClose={() => setIsSnapFlyoutOpen(false)}
            />
          )}
        </div>

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
