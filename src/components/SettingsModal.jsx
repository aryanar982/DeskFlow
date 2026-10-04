import React, { useState } from 'react';
import {
  X,
  Palette,
  Maximize2,
  LayoutGrid,
  Check,
  Pipette,
  Minimize2,
  RectangleHorizontal,
  Lock,
  Unlock,
  Pin,
  Sliders,
  Type,
} from 'lucide-react';

const ACCENT_PRESETS = [
  { id: 'blue', label: 'Windows Blue', color: '#0078d4' },
  { id: 'cyan', label: 'Cyber Cyan', color: '#06b6d4' },
  { id: 'purple', label: 'Violet', color: '#8b5cf6' },
  { id: 'emerald', label: 'Emerald', color: '#10b981' },
  { id: 'sunset', label: 'Sunset', color: '#f97316' },
  { id: 'rose', label: 'Rose Pink', color: '#f43f5e' },
  { id: 'amber', label: 'Amber Gold', color: '#f59e0b' },
  { id: 'lime', label: 'Neon Lime', color: '#84cc16' },
];



const FONT_OPTIONS = [
  { id: 'jakarta', name: 'Plus Jakarta', family: "'Plus Jakarta Sans', sans-serif", subtitle: 'Default • Geometric' },
  { id: 'system', name: 'Segoe UI', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif", subtitle: 'Windows 11 Native' },
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", subtitle: 'Neutral Interface' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", subtitle: 'Friendly Humanist' },
  { id: 'mono', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", subtitle: 'Developer Monospace' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", subtitle: 'Clean Universal' },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSetting,
  updateNestedSetting,
  togglePin,
}) {
  const [activeTab, setActiveTab] = useState('customize'); // 'customize' | 'layout'

  if (!isOpen) return null;

  const handleOpacityChange = (val) => {
    updateSetting('opacity', val);
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setOpacity) {
      window.deskflowAPI.windowControl.setOpacity(val);
    }
  };

  const handleToggleLock = () => {
    updateSetting('lockWidget', !settings.lockWidget);
  };

  const handleToggleAlwaysOnTop = async () => {
    if (togglePin) {
      await togglePin();
    } else if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.togglePin) {
      const isPinned = await window.deskflowAPI.windowControl.togglePin();
      updateSetting('alwaysOnTop', isPinned);
    } else {
      updateSetting('alwaysOnTop', !settings.alwaysOnTop);
    }
  };

  const handleSnap = (pos) => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.snapTo) {
      window.deskflowAPI.windowControl.snapTo(pos);
    }
  };

  const handleCustomColorChange = (hex) => {
    updateSetting('accent', 'custom');
    updateSetting('customAccentColor', hex);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'min(420px, calc(100vw - 20px))',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '12px 14px 10px',
            borderBottom: '1px solid var(--border-subtle)',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}>
              <Sliders size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                DeskFlow Settings & Customization
              </span>
            </h2>
            <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)', margin: '2px 0 0 22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Personalize accent color, opacity, font & layout
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} style={{ flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>

        {/* Tab Navigation - Perfectly aligned 2 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            padding: '6px 10px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            className={`nav-tab ${activeTab === 'customize' ? 'active' : ''}`}
            onClick={() => setActiveTab('customize')}
            style={{
              fontSize: 11,
              padding: '6px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              minWidth: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            <Palette size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Customize</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
            style={{
              fontSize: 11,
              padding: '6px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              minWidth: 0,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            <LayoutGrid size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Sizes & Layout</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '14px 14px',
            overflowY: 'auto',
            overflowX: 'hidden',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* =================================================================
              TAB 1: CUSTOMIZE (Color, Background, Opacity, Font)
             ================================================================= */}
          {activeTab === 'customize' && (
            <>
              {/* 1. Accent Color */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Palette size={12} /> Accent Color
                  </label>
                  {settings.accent === 'custom' && (
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-family-mono)', color: 'var(--accent-primary)' }}>
                      Custom {settings.customAccentColor?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                  {ACCENT_PRESETS.map((ac) => {
                    const isSelected = settings.accent === ac.id;
                    return (
                      <button
                        key={ac.id}
                        type="button"
                        onClick={() => updateSetting('accent', ac.id)}
                        title={ac.label}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: ac.color,
                          border: isSelected ? '2.5px solid white' : '2px solid transparent',
                          boxShadow: isSelected ? `0 0 12px ${ac.color}` : 'none',
                          transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </button>
                    );
                  })}

                  {/* Custom Color Wheel Picker */}
                  <label
                    title="Choose Custom Color"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: settings.accent === 'custom' ? settings.customAccentColor : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                      border: settings.accent === 'custom' ? '2.5px solid white' : '2px solid transparent',
                      boxShadow: settings.accent === 'custom' ? `0 0 12px ${settings.customAccentColor}` : 'none',
                      transform: settings.accent === 'custom' ? 'scale(1.15)' : 'scale(1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      marginLeft: 4,
                    }}
                  >
                    <input
                      type="color"
                      value={settings.customAccentColor || '#0078d4'}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      style={{
                        opacity: 0,
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                    />
                    <Pipette size={13} color="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }} />
                  </label>
                </div>
              </div>



              {/* 2. Opacity */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Translucent Acrylic Opacity
                  </label>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-family-mono)', color: 'var(--accent-primary)' }}>
                    {Math.round((settings.opacity ?? 0.88) * 100)}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0.35"
                  max="1.0"
                  step="0.02"
                  value={settings.opacity ?? 0.88}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              {/* 3. Font Option */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Type size={12} /> Typography Font Family
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = (settings.fontFamily || 'jakarta') === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => updateSetting('fontFamily', f.id)}
                        style={{
                          background: isSelected ? 'var(--accent-soft)' : 'var(--bg-card)',
                          border: isSelected
                            ? '1.5px solid var(--accent-primary)'
                            : '1px solid var(--border-card)',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: f.family,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                          }}
                        >
                          {f.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                          {f.subtitle}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              TAB 2: SIZES & LAYOUT (Lock widget, Always on top, Sizing as is)
             ================================================================= */}
          {activeTab === 'layout' && (
            <>
              {/* Lock Widget & Always on Top Controls */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                  Widget Window Behavior
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* Lock Widget Card */}
                  <div
                    onClick={handleToggleLock}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.lockWidget ? 'var(--accent-soft)' : 'var(--bg-card)',
                      border: settings.lockWidget ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                        {settings.lockWidget ? (
                          <Lock size={14} style={{ color: 'var(--accent-primary)' }} />
                        ) : (
                          <Unlock size={14} style={{ color: 'var(--text-secondary)' }} />
                        )}
                        <span>Lock Widget</span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: settings.lockWidget ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: settings.lockWidget ? '#fff' : 'var(--text-tertiary)',
                        }}
                      >
                        {settings.lockWidget ? 'Locked' : 'Off'}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                      {settings.lockWidget ? 'Position fixed • Dragging disabled' : 'Click to lock widget position'}
                    </span>
                  </div>

                  {/* Always on Top Card */}
                  <div
                    onClick={handleToggleAlwaysOnTop}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.alwaysOnTop ? 'var(--accent-soft)' : 'var(--bg-card)',
                      border: settings.alwaysOnTop ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 12 }}>
                        <Pin
                          size={14}
                          style={{
                            color: settings.alwaysOnTop ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            transform: settings.alwaysOnTop ? 'rotate(45deg)' : 'none',
                            transition: 'transform var(--transition-fast)',
                          }}
                        />
                        <span>Always on Top</span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: settings.alwaysOnTop ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: settings.alwaysOnTop ? '#fff' : 'var(--text-tertiary)',
                        }}
                      >
                        {settings.alwaysOnTop ? 'Pinned' : 'Off'}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                      {settings.alwaysOnTop ? 'Stays visible above other apps' : 'Click to keep pinned in front'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Widget Sizing (Compact vs Fullscreen) - UNTOUCHED, exact sizing as is */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                  Widget Sizing & Layout Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                  {[
                    {
                      id: 'compact',
                      label: 'Compact',
                      badge: '340px',
                      desc: 'Compact desktop widget (340×400px)',
                      icon: Minimize2,
                    },
                    {
                      id: 'medium',
                      label: 'Medium',
                      badge: '480px',
                      desc: 'Balanced desktop layout (480×700px)',
                      icon: RectangleHorizontal,
                    },
                    {
                      id: 'fullscreen',
                      label: 'Fullscreen',
                      badge: 'Full',
                      desc: 'Expands to full desktop screen',
                      icon: Maximize2,
                    },
                  ].map((sz) => {
                    const isSelected = (settings.widgetSize || 'compact') === sz.id;
                    const IconComponent = sz.icon;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          updateSetting('widgetSize', sz.id);
                          if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
                            window.deskflowAPI.windowControl.setSizePreset(sz.id);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 4px',
                          gap: 4,
                          minWidth: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <IconComponent size={15} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sz.label}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'rgba(255,255,255,0.28)' : 'var(--accent-soft)',
                            color: isSelected ? '#fff' : 'var(--accent-primary)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sz.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Preset Indicator */}
                {(() => {
                  const currentSizeId = settings.widgetSize || 'compact';
                  const sizeDetails = {
                    compact: 'Compact widget (340×400px) • Centered on display',
                    medium: 'Medium layout (480×700px) • Centered with expanded task view',
                    fullscreen: 'Fullscreen mode • Maximized across entire laptop display',
                  };
                  return (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '6px 10px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: 10.5,
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)', flexShrink: 0 }}>Active:</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sizeDetails[currentSizeId] || sizeDetails.compact}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Desktop Window Alignment */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                  Desktop Screen Alignment
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSnap('top-right')}
                    style={{ fontSize: 11, padding: '7px 8px', justifyContent: 'center' }}
                  >
                    Top-Right (Default)
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSnap('top-left')}
                    style={{ fontSize: 11, padding: '7px 8px', justifyContent: 'center' }}
                  >
                    Top-Left
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{ minWidth: 100, justifyContent: 'center' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
