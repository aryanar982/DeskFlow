import React, { useState } from 'react';
import { Lock, Unlock, Pin, Palette, Maximize, ArrowLeft } from 'lucide-react';

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
  { id: 'jakarta', name: 'Plus Jakarta' },
  { id: 'system', name: 'Segoe UI' },
  { id: 'inter', name: 'Inter' },
  { id: 'outfit', name: 'Outfit' },
  { id: 'mono', name: 'JetBrains Mono' },
  { id: 'roboto', name: 'Roboto' },
];

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  updateSetting,
  togglePin,
}) {
  const [activeView, setActiveView] = useState('main'); // 'main', 'size', 'customize'

  if (!isOpen) return null;

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

  const handleSize = (sz) => {
    updateSetting('widgetSize', sz);
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
      window.deskflowAPI.windowControl.setSizePreset(sz);
    }
  };

  const handleOpacityChange = (val) => {
    updateSetting('opacity', val);
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => {
        setActiveView('main');
        onClose();
      }} />
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '10px',
          width: '320px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-card)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 9999,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
          gap: '8px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        
        {/* === MAIN VIEW === */}
        {activeView === 'main' && (
          <>
            {/* 1. Lock Widget */}
            <button className="btn btn-secondary" onClick={handleToggleLock} style={{ justifyContent: 'flex-start', padding: '10px 12px' }}>
              {settings.lockWidget ? <Unlock size={14} style={{ marginRight: 6 }}/> : <Lock size={14} style={{ marginRight: 6 }}/>}
              {settings.lockWidget ? 'Unlock Widget' : 'Lock Widget'}
            </button>

            {/* 2. Always on Top */}
            <button className="btn btn-secondary" onClick={handleToggleAlwaysOnTop} style={{ justifyContent: 'flex-start', padding: '10px 12px' }}>
              <Pin size={14} style={{ marginRight: 6, transform: settings.alwaysOnTop ? 'none' : 'rotate(45deg)' }} />
              {settings.alwaysOnTop ? 'Remove Always on Top' : 'Always on Top'}
            </button>

            {/* 3. Size */}
            <button className="btn btn-secondary" onClick={() => setActiveView('size')} style={{ justifyContent: 'flex-start', padding: '10px 12px' }}>
              <Maximize size={14} style={{ marginRight: 6 }} /> Size
            </button>

            {/* 4. Customize Widget */}
            <button className="btn btn-secondary" onClick={() => setActiveView('customize')} style={{ justifyContent: 'flex-start', padding: '10px 12px' }}>
              <Palette size={14} style={{ marginRight: 6 }} /> Customize Widget
            </button>
          </>
        )}

        {/* === SIZE VIEW === */}
        {activeView === 'size' && (
          <>
            <button className="btn btn-secondary" onClick={() => setActiveView('main')} style={{ justifyContent: 'flex-start', padding: '8px', marginBottom: '8px', border: 'none', background: 'transparent' }}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </button>
            <div style={{ fontSize: 12, marginBottom: 8, paddingLeft: 8, color: 'var(--text-secondary)' }}>Choose Widget Size:</div>
            
            <button className={`btn ${settings.widgetSize === 'compact' || !settings.widgetSize ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSize('compact')} style={{ justifyContent: 'center', padding: '10px 12px' }}>
              Small
            </button>
            <button className={`btn ${settings.widgetSize === 'medium' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSize('medium')} style={{ justifyContent: 'center', padding: '10px 12px' }}>
              Medium
            </button>
            <button className={`btn ${settings.widgetSize === 'fullscreen' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleSize('fullscreen')} style={{ justifyContent: 'center', padding: '10px 12px' }}>
              Full Screen
            </button>
          </>
        )}

        {/* === CUSTOMIZE VIEW === */}
        {activeView === 'customize' && (
          <>
            <button className="btn btn-secondary" onClick={() => setActiveView('main')} style={{ justifyContent: 'flex-start', padding: '8px', marginBottom: '4px', border: 'none', background: 'transparent' }}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              
              {/* Color */}
              <div>
                <div style={{ fontSize: 11, marginBottom: 8 }}>Color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {ACCENT_PRESETS.map((ac) => (
                    <div
                      key={ac.id}
                      onClick={() => updateSetting('accent', ac.id)}
                      title={ac.label}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: ac.color,
                        border: settings.accent === ac.id ? '2.5px solid white' : 'none',
                        cursor: 'pointer',
                        boxShadow: settings.accent === ac.id ? `0 0 10px ${ac.color}` : 'none',
                        margin: 'auto'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color / Opacity */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, marginBottom: 8 }}>Background Opacity</div>
                <input type="range" min="0.3" max="1.0" step="0.05" value={settings.opacity ?? 0.88} onChange={(e) => handleOpacityChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
              </div>

              {/* Font */}
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, marginBottom: 8 }}>Font</div>
                <select 
                  value={settings.fontFamily || 'jakarta'} 
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-card)', borderRadius: 6, outline: 'none' }}
                >
                  {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}
