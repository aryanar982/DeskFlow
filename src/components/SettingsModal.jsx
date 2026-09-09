import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Palette,
  Volume2,
  Power,
  Magnet,
  Ghost,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Type,
  Maximize2,
  LayoutGrid,
  Check,
  Pipette,
  Eye,
  Minimize2,
  Square,
  Circle,
} from 'lucide-react';

const THEME_OPTIONS = [
  {
    id: 'windows11',
    name: 'Windows 11',
    badge: 'Fluent 2',
    description: 'Acrylic translucent backdrop, subtle specular highlights, elevated cards.',
    previewBg: '#1c1e24',
    previewCard: '#282b34',
    previewBorder: 'rgba(255, 255, 255, 0.16)',
    previewAccent: '#0078d4',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    badge: 'Zen Focus',
    description: 'Monochrome distraction-free interface with clean hairline borders.',
    previewBg: '#121216',
    previewCard: '#1c1c22',
    previewBorder: 'rgba(255, 255, 255, 0.1)',
    previewAccent: '#9e9ea7',
  },
  {
    id: 'glass',
    name: 'Glass',
    badge: 'Frost Glass',
    description: 'Deep crystalline glassmorphism, high frost blur, and iridescent borders.',
    previewBg: 'rgba(14, 18, 30, 0.7)',
    previewCard: 'rgba(255, 255, 255, 0.12)',
    previewBorder: 'rgba(255, 255, 255, 0.35)',
    previewAccent: '#38bdf8',
  },
  {
    id: 'amoled',
    name: 'AMOLED',
    badge: 'Pure Black',
    description: 'True #000000 pitch black surfaces with vibrant high-contrast colors.',
    previewBg: '#000000',
    previewCard: '#0c0c0e',
    previewBorder: '#22222a',
    previewAccent: '#22c55e',
  },
  {
    id: 'material',
    name: 'Material',
    badge: 'Material 3',
    description: 'Material You tonal surfaces, rounded pill containers, and organic shadows.',
    previewBg: '#16141b',
    previewCard: '#211e29',
    previewBorder: '#49454f',
    previewAccent: '#d0bcff',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    badge: 'Neon City',
    description: 'High-voltage electric cyan & magenta glows with futuristic tech styling.',
    previewBg: '#0a0916',
    previewCard: '#14102a',
    previewBorder: '#00f0ff',
    previewAccent: '#ff0055',
  },
];

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
  { id: 'system', name: 'Segoe UI', family: "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif", subtitle: 'Windows 11 Native' },
  { id: 'jakarta', name: 'Plus Jakarta', family: "'Plus Jakarta Sans', sans-serif", subtitle: 'Modern Geometric' },
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", subtitle: 'Neutral Interface' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", subtitle: 'Friendly Humanist' },
  { id: 'mono', name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", subtitle: 'Developer Monospace' },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", subtitle: 'Clean Universal' },
];

const CORNER_PRESETS = [
  { label: 'Sharp', radius: 0 },
  { label: 'Subtle', radius: 6 },
  { label: 'Rounded', radius: 14 },
  { label: 'Pill', radius: 22 },
];

const BLUR_PRESETS = [
  { label: 'Off', blur: 0 },
  { label: 'Subtle', blur: 12 },
  { label: 'Fluent', blur: 24 },
  { label: 'Heavy', blur: 36 },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSetting,
  updateNestedSetting,
  isClickThrough,
  onToggleClickThrough,
}) {
  const [activeTab, setActiveTab] = useState('themes'); // 'themes' | 'styling' | 'layout'

  if (!isOpen) return null;

  const handleOpacityChange = (val) => {
    updateSetting('opacity', val);
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setOpacity) {
      window.deskflowAPI.windowControl.setOpacity(val);
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
          width: '460px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Palette size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>DeskFlow Personalization & Settings</span>
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0 23px' }}>
              Custom themes, typography, glass effects & layouts
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '6px 12px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            className={`nav-tab ${activeTab === 'themes' ? 'active' : ''}`}
            onClick={() => setActiveTab('themes')}
            style={{ fontSize: 11, padding: '5px 8px' }}
          >
            <Palette size={12} /> Themes & Colors
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'styling' ? 'active' : ''}`}
            onClick={() => setActiveTab('styling')}
            style={{ fontSize: 11, padding: '5px 8px' }}
          >
            <Type size={12} /> Styling & Glass
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'layout' ? 'active' : ''}`}
            onClick={() => setActiveTab('layout')}
            style={{ fontSize: 11, padding: '5px 8px' }}
          >
            <LayoutGrid size={12} /> Sizes & Layout
          </button>

        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            padding: '14px 16px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* =================================================================
              TAB 1: THEMES & COLORS
             ================================================================= */}
          {activeTab === 'themes' && (
            <>
              {/* Theme Picker Cards */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                  Select Theme ({THEME_OPTIONS.length} Aesthetic Styles)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {THEME_OPTIONS.map((th) => {
                    const isSelected = settings.theme === th.id;
                    return (
                      <div
                        key={th.id}
                        onClick={() => updateSetting('theme', th.id)}
                        style={{
                          background: th.previewBg,
                          border: isSelected
                            ? '2px solid var(--accent-primary)'
                            : `1px solid ${th.previewBorder}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all var(--transition-fast)',
                          boxShadow: isSelected ? '0 0 14px var(--accent-glow)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#f3f3f3' }}>
                            {th.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9.5,
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-full)',
                              background: th.previewCard,
                              border: `1px solid ${th.previewBorder}`,
                              color: th.previewAccent,
                              fontWeight: 600,
                            }}
                          >
                            {th.badge}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 10,
                            color: '#a0a0b0',
                            margin: '4px 0 8px',
                            lineHeight: 1.3,
                          }}
                        >
                          {th.description}
                        </p>
                        {/* Mini preview bar */}
                        <div
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: th.previewCard,
                            border: `1px solid ${th.previewBorder}`,
                            overflow: 'hidden',
                            display: 'flex',
                          }}
                        >
                          <div style={{ width: '45%', background: th.previewAccent }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Mode Toggle (Dark / Light) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Color Mode Variant</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn ${settings.themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateSetting('themeMode', 'dark')}
                    style={{ gap: 6, justifyContent: 'center' }}
                  >
                    <Moon size={13} /> Dark Mode
                  </button>
                  <button
                    type="button"
                    className={`btn ${settings.themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => updateSetting('themeMode', 'light')}
                    style={{ gap: 6, justifyContent: 'center' }}
                  >
                    <Sun size={13} /> Light Mode
                  </button>
                </div>
              </div>

              {/* Accent Color Palette */}
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
            </>
          )}

          {/* =================================================================
              TAB 2: STYLING & GLASS
             ================================================================= */}
          {activeTab === 'styling' && (
            <>
              {/* Font Family Selector */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                  Typography Font Family
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = settings.fontFamily === f.id;
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

              {/* Corner Radius Slider & Presets */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Corner Radius
                  </label>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-family-mono)', color: 'var(--accent-primary)' }}>
                    {settings.cornerRadius ?? 14}px
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={settings.cornerRadius ?? 14}
                  onChange={(e) => updateSetting('cornerRadius', parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', marginBottom: 8 }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {CORNER_PRESETS.map((cp) => (
                    <button
                      key={cp.label}
                      type="button"
                      className={`btn ${(settings.cornerRadius ?? 14) === cp.radius ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateSetting('cornerRadius', cp.radius)}
                      style={{ fontSize: 10.5, padding: '4px 0', justifyContent: 'center' }}
                    >
                      {cp.label} ({cp.radius}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur Intensity Slider & Presets */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Backdrop Blur Intensity
                  </label>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-family-mono)', color: 'var(--accent-primary)' }}>
                    {settings.blur ?? 28}px
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="40"
                  step="2"
                  value={settings.blur ?? 28}
                  onChange={(e) => updateSetting('blur', parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', marginBottom: 8 }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {BLUR_PRESETS.map((bp) => (
                    <button
                      key={bp.label}
                      type="button"
                      className={`btn ${(settings.blur ?? 28) === bp.blur ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateSetting('blur', bp.blur)}
                      style={{ fontSize: 10.5, padding: '4px 0', justifyContent: 'center' }}
                    >
                      {bp.label} ({bp.blur}px)
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Slider */}
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
            </>
          )}

          {/* =================================================================
              TAB 3: SIZES & LAYOUT
             ================================================================= */}
          {activeTab === 'layout' && (
            <>
              {/* Widget Size (Width) */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                  Widget Footprint Size
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'compact', label: 'Compact', width: '360px', desc: 'Glance Widget (360px)' },
                    { id: 'medium', label: 'Medium', width: '420px', desc: 'Balanced Glance (420px)' },
                    { id: 'large', label: 'Large', width: '480px', desc: 'Expanded Hub (480px)' },
                  ].map((sz) => {
                    const isSelected = (settings.widgetSize || 'medium') === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => updateSetting('widgetSize', sz.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          padding: '8px 6px',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 11.5 }}>{sz.label}</span>
                        <span style={{ fontSize: 10, opacity: 0.85, fontFamily: 'var(--font-family-mono)' }}>
                          {sz.width}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Density */}
              <div>
                <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>
                  Layout Content Density
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {[
                    { id: 'compact', label: 'Dense', desc: 'Tighter lists' },
                    { id: 'medium', label: 'Standard', desc: 'Balanced padding' },
                    { id: 'large', label: 'Spacious', desc: 'Comfortable target' },
                  ].map((dn) => {
                    const isSelected = (settings.layoutDensity || 'medium') === dn.id;
                    return (
                      <button
                        key={dn.id}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => updateSetting('layoutDensity', dn.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          padding: '7px 4px',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: 11 }}>{dn.label}</span>
                        <span style={{ fontSize: 9.5, opacity: 0.8 }}>{dn.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modular Widgets Visibility Toggles */}
              <div>
                <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                  Modular Dashboard Widgets
                </label>
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {[
                    { key: 'progressBar', label: 'Completion Progress Bar' },
                    { key: 'quickAdd', label: 'Quick Add Bar' },
                    { key: 'quickLaunch', label: 'Quick Launch Shortcuts Dock' },
                    { key: 'customWidget', label: 'Custom Modular Card (Quote / Note)' },
                  ].map((mod) => (
                    <label
                      key={mod.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        fontSize: 11.5,
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{mod.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settings.enabledWidgets?.[mod.key])}
                        onChange={(e) => {
                          if (updateNestedSetting) {
                            updateNestedSetting('enabledWidgets', mod.key, e.target.checked);
                          } else {
                            updateSetting('enabledWidgets', {
                              ...settings.enabledWidgets,
                              [mod.key]: e.target.checked,
                            });
                          }
                        }}
                        style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15 }}
                      />
                    </label>
                  ))}
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
