import { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { getAccentTokens } from '../utils/colorUtils';

export function useSettings() {
  const [settings, setSettings] = useState(() => storage.getSettings());

  useEffect(() => {
    storage.setSettings(settings);

    const root = document.documentElement;

    // Apply dataset attributes
    root.setAttribute('data-theme', settings.theme || 'windows11');
    root.setAttribute('data-theme-mode', settings.themeMode || 'dark');
    root.setAttribute('data-accent', settings.accent || 'blue');
    root.setAttribute('data-font', settings.fontFamily || 'jakarta');
    root.setAttribute('data-density', settings.layoutDensity || 'medium');

    // Dynamic numeric styling properties
    root.style.setProperty('--widget-opacity', settings.opacity ?? 0.88);
    root.style.setProperty('--glass-blur', `${settings.blur ?? 28}px`);
    root.style.setProperty('--radius-corner', `${settings.cornerRadius ?? 14}px`);

    // Widget size dimensions
    const sizeMap = {
      compact: { width: 360, height: 700, cssWidth: '360px' },
      medium: { width: 420, height: 730, cssWidth: '420px' },
      large: { width: 480, height: 780, cssWidth: '480px' },
    };
    const dimensions = sizeMap[settings.widgetSize] || sizeMap.medium;
    root.style.setProperty('--widget-width', dimensions.cssWidth);

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

    // Sync window pin and size if running inside Electron
    if (typeof window !== 'undefined' && window.deskflowAPI?.windowControl) {
      window.deskflowAPI.windowControl.setSize(dimensions.width, dimensions.height);
      if (typeof window.deskflowAPI.windowControl.setOpacity === 'function') {
        window.deskflowAPI.windowControl.setOpacity(settings.opacity ?? 0.88);
      }
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

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
