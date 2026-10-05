import {
  Code,
  Globe,
  MessageSquare,
  Music,
  Palette,
  FileText,
  Cpu,
  Terminal,
  Folder,
  AppWindow,
  Tv,
  Hash,
} from 'lucide-react';

export const APP_CATEGORIES = {
  DEVELOPMENT: { name: 'Development', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', icon: Code },
  BROWSING: { name: 'Browsing', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', icon: Globe },
  PRODUCTIVITY: { name: 'Productivity', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: FileText },
  COMMUNICATION: { name: 'Communication', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', icon: MessageSquare },
  DESIGN: { name: 'Design', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', icon: Palette },
  ENTERTAINMENT: { name: 'Entertainment', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Music },
  SYSTEM: { name: 'System', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', icon: Cpu },
  OTHER: { name: 'Other', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: AppWindow },
};

export const APP_METADATA = {
  code: { name: 'Visual Studio Code', category: 'DEVELOPMENT', icon: Code, color: '#007acc' },
  devenv: { name: 'Visual Studio', category: 'DEVELOPMENT', icon: Code, color: '#5c2d91' },
  chrome: { name: 'Google Chrome', category: 'BROWSING', icon: Globe, color: '#ea4335' },
  msedge: { name: 'Microsoft Edge', category: 'BROWSING', icon: Globe, color: '#0078d4' },
  firefox: { name: 'Mozilla Firefox', category: 'BROWSING', icon: Globe, color: '#ff7139' },
  brave: { name: 'Brave Browser', category: 'BROWSING', icon: Globe, color: '#ff1b2d' },
  spotify: { name: 'Spotify', category: 'ENTERTAINMENT', icon: Music, color: '#1ed760' },
  youtube: { name: 'YouTube', category: 'ENTERTAINMENT', icon: Tv, color: '#ff0000' },
  discord: { name: 'Discord', category: 'COMMUNICATION', icon: Hash, color: '#5865f2' },
  slack: { name: 'Slack', category: 'COMMUNICATION', icon: MessageSquare, color: '#4a154b' },
  teams: { name: 'Microsoft Teams', category: 'COMMUNICATION', icon: MessageSquare, color: '#6264a7' },
  figma: { name: 'Figma', category: 'DESIGN', icon: Palette, color: '#f24e1e' },
  notepad: { name: 'Notepad', category: 'PRODUCTIVITY', icon: FileText, color: '#60a5fa' },
  deskflow: { name: 'DeskFlow', category: 'PRODUCTIVITY', icon: AppWindow, color: '#0078d4' },
  word: { name: 'Microsoft Word', category: 'PRODUCTIVITY', icon: FileText, color: '#2b579a' },
  winword: { name: 'Microsoft Word', category: 'PRODUCTIVITY', icon: FileText, color: '#2b579a' },
  excel: { name: 'Microsoft Excel', category: 'PRODUCTIVITY', icon: FileText, color: '#217346' },
  powerpnt: { name: 'Microsoft PowerPoint', category: 'PRODUCTIVITY', icon: FileText, color: '#d24726' },
  explorer: { name: 'File Explorer', category: 'SYSTEM', icon: Folder, color: '#f59e0b' },
  powershell: { name: 'PowerShell', category: 'SYSTEM', icon: Terminal, color: '#5391fe' },
  cmd: { name: 'Command Prompt', category: 'SYSTEM', icon: Terminal, color: '#a855f7' },
};

export function getAppInfo(procName = '') {
  const normalized = procName.toLowerCase().replace('.exe', '');
  if (APP_METADATA[normalized]) {
    const meta = APP_METADATA[normalized];
    return {
      id: normalized,
      displayName: meta.name,
      categoryKey: meta.category,
      category: APP_CATEGORIES[meta.category] || APP_CATEGORIES.OTHER,
      Icon: meta.icon,
      color: meta.color,
    };
  }

  // Formatting fallback for unknown apps
  const displayName = procName
    .replace('.exe', '')
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: normalized || 'other',
    displayName: displayName || 'Application',
    categoryKey: 'OTHER',
    category: APP_CATEGORIES.OTHER,
    Icon: AppWindow,
    color: '#38bdf8',
  };
}

export function formatTime(seconds = 0) {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m`;
  }
  return `${seconds}s`;
}

export function formatDateKey(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLabel(dateKey) {
  const today = formatDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateKey(yesterdayDate);

  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';

  const dateObj = parseDateKey(dateKey);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// Generate realistic 14-day historical sample data for seamless initial display
export function generateSeedHistory() {
  const days = {};
  const sampleApps = [
    { proc: 'code', baseSecs: 7200, category: 'DEVELOPMENT' },
    { proc: 'chrome', baseSecs: 5400, category: 'BROWSING' },
    { proc: 'figma', baseSecs: 3600, category: 'DESIGN' },
    { proc: 'spotify', baseSecs: 1800, category: 'ENTERTAINMENT' },
    { proc: 'notepad', baseSecs: 2400, category: 'PRODUCTIVITY' },
    { proc: 'discord', baseSecs: 1200, category: 'COMMUNICATION' },
    { proc: 'explorer', baseSecs: 600, category: 'SYSTEM' },
  ];

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);

    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const factor = isWeekend ? 0.6 : 1.0;

    let dayTotal = 0;
    const dayApps = {};

    sampleApps.forEach((app) => {
      const variation = (Math.random() * 0.4 + 0.8) * factor;
      const secs = Math.round(app.baseSecs * variation);
      dayTotal += secs;

      // Hourly usage mock (24 hours)
      const hourlyUsage = Array(24).fill(0);
      for (let h = 9; h <= 18; h++) {
        hourlyUsage[h] = Math.round((secs / 10) * (Math.random() * 0.5 + 0.75));
      }

      const sessions = [
        {
          startTime: d.getTime() + 9 * 3600000,
          endTime: d.getTime() + 12 * 3600000,
          durationSeconds: Math.round(secs * 0.6),
          title: `${getAppInfo(app.proc).displayName} - Active Session`,
        },
        {
          startTime: d.getTime() + 14 * 3600000,
          endTime: d.getTime() + 17 * 3600000,
          durationSeconds: Math.round(secs * 0.4),
          title: `${getAppInfo(app.proc).displayName} - Workspace`,
        },
      ];

      dayApps[app.proc] = {
        id: app.proc,
        name: app.proc,
        totalSeconds: secs,
        hourlyUsage,
        sessions,
      };
    });

    const idleSecs = Math.round(dayTotal * 0.15);

    days[dateKey] = {
      date: dateKey,
      totalScreenTime: dayTotal,
      totalIdleTime: idleSecs,
      apps: dayApps,
    };
  }

  return { days };
}

const LOCAL_STORAGE_KEY = 'deskflow_digital_wellbeing_v1';

export const wellbeingStorage = {
  load: async () => {
    if (typeof window !== 'undefined' && window.deskflowAPI?.wellbeing?.getData) {
      try {
        const data = await window.deskflowAPI.wellbeing.getData();
        if (data && data.days && Object.keys(data.days).length > 0) {
          return data;
        }
      } catch (err) {
        console.error('Failed to load wellbeing via IPC:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.days && Object.keys(parsed.days).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    // Initial seed if no data exists
    const seed = generateSeedHistory();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seed));
    } catch (e) {}
    return seed;
  },

  save: async (data) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}

    if (typeof window !== 'undefined' && window.deskflowAPI?.wellbeing?.saveData) {
      try {
        await window.deskflowAPI.wellbeing.saveData(data);
      } catch (e) {}
    }
  },
};
