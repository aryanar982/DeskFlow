import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { getAccentTokens } from '../utils/colorUtils';

export function useSettings() {
  const [settings, setSettings] = useState(() => storage.getSettings());

  useEffect(() => {
    storage.setSettings(settings);

    const root = document.documentElement;

    // Apply dataset attributes
    root.setAttribute('data-theme', 'windows11');
    root.setAttribute('data-theme-mode', settings.themeMode || 'dark');
    root.setAttribute('data-accent', settings.accent || 'blue');
    root.setAttribute('data-font', settings.fontFamily || 'jakarta');
    root.setAttribute('data-density', settings.layoutDensity || 'large');

    // Dynamic numeric styling properties
    root.style.setProperty('--widget-opacity', settings.opacity ?? 0.88);
    root.style.setProperty('--glass-blur', `${settings.blur ?? 28}px`);
    root.style.setProperty('--radius-corner', `${settings.cornerRadius ?? 24}px`);

    // Widget size dimensions (compact: 340px vs medium: 480px vs large: 800px vs fullscreen: 100%)
    const isFullscreen = settings.widgetSize === 'fullscreen';
    const widgetWidth = isFullscreen ? '100%' : (settings.widgetSize === 'medium' ? '480px' : (settings.widgetSize === 'large' ? '800px' : '340px'));
    root.style.setProperty('--widget-width', widgetWidth);

    // Custom accent color computation
    if (settings.accent === 'custom' && settings.customAccentColor) {
      const tokens = getAccentTokens(settings.customAccentColor);
      root.style.setProperty('--accent-primary', tokens.primary);
      root.style.setProperty('--accent-primary-hover', tokens.hover);
      root.style.setProperty('--accent-primary-active', tokens.active);
      root.style.setProperty('--accent-glow', tokens.glow);
      root.style.setProperty('--accent-soft', tokens.soft);
    } else {
      root.style.removeProperty('--accent-primary');
      root.style.removeProperty('--accent-primary-hover');
      root.style.removeProperty('--accent-primary-active');
      root.style.removeProperty('--accent-glow');
      root.style.removeProperty('--accent-soft');
    }

    // Sync window controls if running inside Electron
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      if (typeof window.deskflowAPI.windowControl.setOpacity === 'function') {
        window.deskflowAPI.windowControl.setOpacity(1.0); // Keep window fully opaque
      }
      if (typeof window.deskflowAPI.windowControl.setAlwaysOnTop === 'function') {
        window.deskflowAPI.windowControl.setAlwaysOnTop(Boolean(settings.alwaysOnTop));
      }
      if (typeof window.deskflowAPI.windowControl.setLocked === 'function') {
        window.deskflowAPI.windowControl.setLocked(Boolean(settings.lockWidget));
      }
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (key === 'widgetSize' && typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setSizePreset) {
      window.deskflowAPI.windowControl.setSizePreset(value);
    }

    if (key === 'alwaysOnTop' && typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setAlwaysOnTop) {
      window.deskflowAPI.windowControl.setAlwaysOnTop(value);
    }

    if (key === 'lockWidget' && typeof window !== 'undefined' && window.deskflowAPI?.windowControl?.setLocked) {
      window.deskflowAPI.windowControl.setLocked(value);
    }



    if (key === 'autoStart' && typeof window !== 'undefined' && window.deskflowAPI?.settings) {
      window.deskflowAPI.settings.setAutostart(value);
    }
  };

  const updateNestedSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const toggleTheme = () => {
    updateSetting('themeMode', settings.themeMode === 'dark' ? 'light' : 'dark');
  };

  const togglePin = async () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      const isPinned = await window.deskflowAPI.windowControl.togglePin();
      updateSetting('alwaysOnTop', isPinned);
    } else {
      updateSetting('alwaysOnTop', !settings.alwaysOnTop);
    }
  };

  return {
    settings,
    updateSetting,
    updateNestedSetting,
    toggleTheme,
    togglePin,
  };
}
