import { getLocalDateString } from '../utils/dateUtils';

const STORAGE_KEYS = {
  TASKS: 'deskflow_tasks_v1',
  SHORTCUTS: 'deskflow_shortcuts_v1',
  SETTINGS: 'deskflow_settings_v1',
  NOTES: 'deskflow_notes_v1',
  POMODORO: 'deskflow_pomo_v1',
  FOCUS_HISTORY: 'deskflow_focus_history_v2',
};

const DEFAULT_TASKS = [
  {
    id: 't-1',
    title: 'UI Design & Windows 11 Fluent 2 Spec',
    priority: 'urgent',
    category: '',
    tags: [],
    color: 'purple',
    pinned: true,
    archived: false,
    dueDate: getLocalDateString(),
    dueTime: '11:00',
    dueDateTime: `${getLocalDateString()}T11:00:00`,
    recurrence: 'none',
    attachments: [
      { id: 'att-1', name: 'fluent2-guidelines.url', type: 'url', path: 'https://developer.microsoft.com/en-us/fluentui' }
    ],
    completed: false,
    order: 0,
    createdAt: Date.now() - 3600000 * 4,
  },
  {
    id: 't-2',
    title: 'Electron Native IPC & System Monitors',
    priority: 'high',
    category: '',
    tags: [],
    color: 'blue',
    pinned: false,
    archived: false,
    dueDate: getLocalDateString(),
    dueTime: '14:30',
    dueDateTime: `${getLocalDateString()}T14:30:00`,
    recurrence: 'none',
    attachments: [],
    completed: true,
    order: 1,
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    id: 't-3',
    title: 'DeskFlow v1.5 Product Presentation',
    priority: 'medium',
    category: '',
    tags: [],
    color: 'emerald',
    pinned: false,
    archived: false,
    dueDate: getLocalDateString(new Date(Date.now() + 86400000)),
    dueTime: '16:00',
    dueDateTime: `${getLocalDateString(new Date(Date.now() + 86400000))}T16:00:00`,
    recurrence: 'none',
    attachments: [],
    completed: false,
    order: 2,
    createdAt: Date.now() - 3600000 * 12,
  },
];

const DEFAULT_SHORTCUTS = [
  { id: 'sc-1', label: 'Chrome', icon: 'Globe', type: 'url', target: 'https://google.com' },
  { id: 'sc-2', label: 'VS Code', icon: 'Code', type: 'app', target: 'code' },
  { id: 'sc-3', label: 'Explorer', icon: 'Folder', type: 'app', target: 'explorer' },
  { id: 'sc-4', label: 'Notion', icon: 'FileText', type: 'url', target: 'https://notion.so' },
  { id: 'sc-5', label: 'GitHub', icon: 'GitBranch', type: 'url', target: 'https://github.com' },
  { id: 'sc-6', label: 'ChatGPT', icon: 'Bot', type: 'url', target: 'https://chatgpt.com' },
];

export const THEMES = {
  WINDOWS11: 'windows11',
  MINIMAL: 'minimal',
  GLASS: 'glass',
  AMOLED: 'amoled',
  MATERIAL: 'material',
  CYBERPUNK: 'cyberpunk',
};

const DEFAULT_SETTINGS = {
  userName: 'Aryan',
  theme: 'windows11', // 'windows11' | 'minimal' | 'glass' | 'amoled' | 'material' | 'cyberpunk'
  themeMode: 'dark',  // 'dark' | 'light'
  accent: 'blue',     // 'blue' | 'purple' | 'emerald' | 'sunset' | 'rose' | 'cyan' | 'amber' | 'lime' | 'custom'
  customAccentColor: '#0078d4',
  fontFamily: 'jakarta', // 'system' | 'jakarta' | 'inter' | 'outfit' | 'mono' | 'roboto'
  cornerRadius: 14,   // 0 to 24 (px)
  blur: 28,           // 0 to 40 (px)
  opacity: 0.88,      // 0.35 to 1.0
  widgetSize: 'compact', // Compact desktop widget (340x350)
  layoutDensity: 'compact', // 'compact' | 'medium' | 'large'
  enabledWidgets: {
    progressBar: true,
    quickAdd: true,
    quickLaunch: true,
    systemStats: true,
    customWidget: false,
  },
  customWidgetConfig: {
    title: 'Daily Focus Mantra',
    content: 'Flow with intention. Deep work produces rare value.',
    type: 'quote', // 'quote' | 'countdown' | 'note'
    targetDate: '',
  },
  alwaysOnTop: true,
  autoStart: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

function migrateSettings(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const migrated = { ...DEFAULT_SETTINGS, ...raw };

  // Theme legacy migration
  if (raw.theme === 'dark') {
    migrated.theme = 'windows11';
    migrated.themeMode = 'dark';
  } else if (raw.theme === 'light') {
    migrated.theme = 'windows11';
    migrated.themeMode = 'light';
  }

  // Widget size legacy migration
  if (raw.widgetSize === 'normal') migrated.widgetSize = 'medium';
  if (raw.widgetSize === 'wide') migrated.widgetSize = 'large';

  // Merge nested config
  migrated.enabledWidgets = {
    ...DEFAULT_SETTINGS.enabledWidgets,
    ...(raw.enabledWidgets || {}),
  };

  migrated.customWidgetConfig = {
    ...DEFAULT_SETTINGS.customWidgetConfig,
    ...(raw.customWidgetConfig || {}),
  };

  return migrated;
}

const DEFAULT_NOTE = `📌 Quick Scratchpad
- Review sprint backlog
- Prepare demo for team
- Check CPU & memory usage widget`;

// Normalizes and migrates task schema from legacy v1 to v1.5
function migrateTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) return DEFAULT_TASKS;

  return rawTasks.map((t, idx) => {
    const rawTags = Array.isArray(t.tags)
      ? t.tags
      : (t.tag ? [t.tag] : []);
    const tags = rawTags.filter((tag) => tag && tag.toLowerCase() !== 'general');

    const subtasks = Array.isArray(t.subtasks)
      ? t.subtasks.map((st, sidx) => ({
          id: st.id || `st-${t.id}-${sidx}`,
          title: st.title || 'Subtask',
          completed: Boolean(st.completed),
        }))
      : [];

    const attachments = Array.isArray(t.attachments)
      ? t.attachments.map((att, aidx) => ({
          id: att.id || `att-${t.id}-${aidx}`,
          name: att.name || 'Attachment',
          type: att.type || 'url',
          path: att.path || '',
        }))
      : [];

    return {
      id: t.id || 't-' + (Date.now() + idx),
      title: t.title || 'Untitled Task',
      description: t.description || '',
      priority: t.priority || 'medium',
      category: t.category || '',
      tags,
      color: t.color || 'none',
      pinned: Boolean(t.pinned),
      archived: Boolean(t.archived),
      dueDate: t.dueDate || getLocalDateString(),
      dueTime: t.dueTime || '12:00',
      dueDateTime: t.dueDateTime || `${t.dueDate || getLocalDateString()}T${t.dueTime || '12:00'}:00`,
      recurrence: t.recurrence || 'none', // 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly'
      subtasks,
      attachments,
      completed: Boolean(t.completed),
      order: typeof t.order === 'number' ? t.order : idx,
      createdAt: t.createdAt || Date.now(),
      updatedAt: t.updatedAt || Date.now(),
    };
  });
}

export const storage = {
  getTasks: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) return DEFAULT_TASKS;
      const parsed = JSON.parse(data);
      const migrated = migrateTasks(parsed);
      return migrated;
    } catch {
      return DEFAULT_TASKS;
    }
  },

  setTasks: (tasks) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save tasks', err);
    }
  },

  getShortcuts: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHORTCUTS);
      return data ? JSON.parse(data) : DEFAULT_SHORTCUTS;
    } catch {
      return DEFAULT_SHORTCUTS;
    }
  },

  setShortcuts: (shortcuts) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHORTCUTS, JSON.stringify(shortcuts));
    } catch (err) {
      console.error('Failed to save shortcuts', err);
    }
  },

  getSettings: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? migrateSettings(JSON.parse(data)) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  setSettings: (settings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  },

  getNote: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.NOTES) ?? DEFAULT_NOTE;
    } catch {
      return DEFAULT_NOTE;
    }
  },

  setNote: (note) => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, note);
    } catch (err) {
      console.error('Failed to save notes', err);
    }
  },

  getFocusHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOCUS_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setFocusHistory: (history) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FOCUS_HISTORY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save focus history', err);
    }
  },
};
