import React from 'react';
import {
  Settings,
  Minus,
  X,
  Layout,
  Maximize2,
  Minimize2,
  ArrowRightToLine,
  RectangleHorizontal,
} from 'lucide-react';

export function TitleBar({
  onOpenSettings,
  isExpanded = false,
  widgetSize = 'compact',
  onToggleMedium,
  onToggleExpand,
  onSnapRight,
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
      className={`titlebar drag-region ${!isExpanded ? 'is-compact-titlebar' : ''}`}
      onDoubleClick={onToggleExpand}
    >
      <div className="titlebar-brand no-drag">
        <div className="titlebar-logo-icon">
          <Layout size={12} strokeWidth={2.5} />
        </div>
        <span className="titlebar-brand-text">DeskFlow</span>
      </div>

      <div className="titlebar-controls no-drag">
        {/* Shift to Top-Right symbol */}
        {onSnapRight && (
          <button
            className="titlebar-btn"
            onClick={onSnapRight}
            title="Snap to Top-Right (Default)"
          >
            <ArrowRightToLine size={13} />
          </button>
        )}

        {/* Medium Size (480px) Toggle */}
        {onToggleMedium && (
          <button
            className={`titlebar-btn ${!isExpanded && widgetSize === 'medium' ? 'active' : ''}`}
            onClick={onToggleMedium}
            title={!isExpanded && widgetSize === 'medium' ? 'Switch to Compact (340px)' : 'Medium Size (480px)'}
            id="titlebar-medium-btn"
          >
            <RectangleHorizontal size={13} />
          </button>
        )}

        {/* Full Screen / Restore Button */}
        {onToggleExpand && (
          <button
            className={`titlebar-btn ${isExpanded ? 'active' : ''}`}
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore to Compact' : 'Full Screen'}
            id="titlebar-fullscreen-btn"
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
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
