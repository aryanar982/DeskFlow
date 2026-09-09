import { getLocalDateString } from './dateUtils';
import { playChime, showNotification } from '../services/notifications';

const STORAGE_KEYS = {
  RULES: 'deskflow_automations_v1',
  LOGS: 'deskflow_automation_logs_v1',
  SETTINGS: 'deskflow_automation_settings_v1',
};

export const TRIGGER_TYPES = {
  APP_OPEN: 'app_open',
  BATTERY_LEVEL: 'battery_level',
  TIME_SCHEDULE: 'time_schedule',
  MEETING_APPROACHING: 'meeting_approaching',
  LOCATION_CONTEXT: 'location_context',
  TASK_OVERDUE: 'task_overdue',
};

export const ACTION_TYPES = {
  FILTER_TASKS: 'filter_tasks',
  ENABLE_FOCUS: 'enable_focus',
  SHOW_NOTIFICATION: 'show_notification',
  AUTO_RESCHEDULE: 'auto_reschedule',
  SWITCH_THEME: 'switch_theme',
  AUTO_PLAN: 'auto_plan',
};

export const DEFAULT_PRESETS = [
  {
    id: 'preset-vscode',
    title: 'VS Code Coding Context',
    description: 'When opening VS Code, filter task omnibox to coding & dev tasks.',
    category: 'app',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.APP_OPEN,
      config: {
        appQuery: 'vs code', // matches 'vs code', 'code', 'visual studio code'
      },
    },
    action: {
      type: ACTION_TYPES.FILTER_TASKS,
      config: {
        query: '#dev',
        notifyTitle: 'Coding Mode Activated 💻',
        notifyBody: 'Showing your active engineering and development tasks.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
  {
    id: 'preset-chrome',
    title: 'Chrome Research Context',
    description: 'When launching Google Chrome, show research and documentation tasks.',
    category: 'app',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.APP_OPEN,
      config: {
        appQuery: 'chrome',
      },
    },
    action: {
      type: ACTION_TYPES.FILTER_TASKS,
      config: {
        query: '#research',
        notifyTitle: 'Research Mode 🔍',
        notifyBody: 'Filtered tasks for research, specs, and reference reading.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
  {
    id: 'preset-battery',
    title: 'Battery Saver Reminder',
    description: 'When battery drops below 20%, send an alert and switch to AMOLED dark mode.',
    category: 'system',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.BATTERY_LEVEL,
      config: {
        threshold: 20,
        onlyWhenDischarging: true,
      },
    },
    action: {
      type: ACTION_TYPES.SWITCH_THEME,
      config: {
        theme: 'amoled',
        notifyTitle: 'Low Battery Alert (20%) 🪫',
        notifyBody: 'Switched DeskFlow to AMOLED pure black mode to conserve battery.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
  {
    id: 'preset-meeting',
    title: 'Pre-Meeting Focus Sprints',
    description: 'When a calendar meeting or commitment is due in 30 mins, enable Focus Mode.',
    category: 'calendar',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.MEETING_APPROACHING,
      config: {
        leadMinutes: 30,
      },
    },
    action: {
      type: ACTION_TYPES.ENABLE_FOCUS,
      config: {
        tab: 'focus',
        notifyTitle: 'Meeting in 30 Minutes ⏰',
        notifyBody: 'Focus mode suggested. Wrap up current work before the call begins.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
  {
    id: 'preset-daily-plan',
    title: '9:00 AM Morning AI Plan',
    description: 'At 9:00 AM every morning, trigger daily planning and top 3 priorities.',
    category: 'schedule',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.TIME_SCHEDULE,
      config: {
        time: '09:00',
        weekdaysOnly: true,
      },
    },
    action: {
      type: ACTION_TYPES.AUTO_PLAN,
      config: {
        notifyTitle: 'Good Morning! 🌅',
        notifyBody: 'Your 3 highest-priority tasks for today have been prepared.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
  {
    id: 'preset-auto-reschedule',
    title: 'Auto-Reschedule Overdue Tasks',
    description: 'Automatically roll overdue tasks forward to Today to keep backlog clean.',
    category: 'tasks',
    enabled: true,
    trigger: {
      type: TRIGGER_TYPES.TASK_OVERDUE,
      config: {
        targetDate: 'today',
      },
    },
    action: {
      type: ACTION_TYPES.AUTO_RESCHEDULE,
      config: {
        rescheduleTo: 'today',
        notifyTitle: 'Overdue Tasks Rescheduled 📅',
        notifyBody: 'Unfinished tasks rolled forward to Today for a fresh focus.',
      },
    },
    lastTriggeredAt: null,
    executionCount: 0,
  },
];

const listeners = new Set();
function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in automation subscriber', e);
    }
  });
}

export const automationEngine = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ----------------------------------------------------------------------
  // Rules Store
  // ----------------------------------------------------------------------
  getRules() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RULES);
      if (!raw) return DEFAULT_PRESETS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PRESETS;
      return parsed;
    } catch {
      return DEFAULT_PRESETS;
    }
  },

  setRules(rules) {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    notifySubscribers();
  },

  toggleRule(ruleId) {
    const rules = this.getRules().map((r) => {
      if (r.id === ruleId) {
        return { ...r, enabled: !r.enabled };
      }
      return r;
    });
    this.setRules(rules);
    const updated = rules.find((r) => r.id === ruleId);
    this.addLog(
      'rule_toggled',
      `Automation "${updated.title}" is now ${updated.enabled ? 'ENABLED' : 'DISABLED'}.`,
      true
    );
    return rules;
  },

  addRule(ruleData) {
    const rules = this.getRules();
    const newRule = {
      id: 'rule-' + Date.now(),
      title: ruleData.title || 'Custom Automation Rule',
      description: ruleData.description || 'Custom user automation rule',
      category: 'custom',
      enabled: true,
      trigger: ruleData.trigger,
      action: ruleData.action,
      lastTriggeredAt: null,
      executionCount: 0,
      createdAt: Date.now(),
    };
    const updated = [newRule, ...rules];
    this.setRules(updated);
    this.addLog('rule_created', `Created custom automation "${newRule.title}".`, true);
    return newRule;
  },

  deleteRule(ruleId) {
    const rules = this.getRules().filter((r) => r.id !== ruleId);
    this.setRules(rules);
    this.addLog('rule_deleted', `Deleted automation rule ${ruleId}.`, true);
    return rules;
  },

  resetToDefaults() {
    this.setRules(DEFAULT_PRESETS);
    this.addLog('rules_reset', 'Reset all automations to factory defaults.', true);
    return DEFAULT_PRESETS;
  },

  // ----------------------------------------------------------------------
  // Execution Logs
  // ----------------------------------------------------------------------
  getLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addLog(type, message, success = true, ruleTitle = null) {
    const logs = this.getLogs();
    const entry = {
      id: 'alog-' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: getLocalDateString(),
      type,
      message,
      ruleTitle,
      success,
    };
    const updated = [entry, ...logs].slice(0, 40); // Keep last 40 logs
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    notifySubscribers();
    return entry;
  },

  clearLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    notifySubscribers();
  },

  // ----------------------------------------------------------------------
  // Trigger Evaluation & Execution Dispatcher
  // ----------------------------------------------------------------------
  async executeAction(action, rule, callbacks = {}) {
    if (!action) return;
    const { config } = action;

    // Increment rule execution counter
    const rules = this.getRules().map((r) => {
      if (r.id === rule.id) {
        return {
          ...r,
          lastTriggeredAt: Date.now(),
          executionCount: (r.executionCount || 0) + 1,
        };
      }
      return r;
    });
    this.setRules(rules);

    try {
      switch (action.type) {
        case ACTION_TYPES.FILTER_TASKS: {
          if (callbacks.setSearchQuery && config.query) {
            callbacks.setSearchQuery(config.query);
          }
          if (callbacks.setActiveTab) {
            callbacks.setActiveTab('tasks');
          }
          if (config.notifyTitle) {
            showNotification(config.notifyTitle, config.notifyBody || '');
            playChime('chime');
          }
          break;
        }

        case ACTION_TYPES.ENABLE_FOCUS: {
          if (callbacks.setActiveTab) {
            callbacks.setActiveTab('focus');
          }
          if (config.notifyTitle) {
            showNotification(config.notifyTitle, config.notifyBody || '');
            playChime('pomo');
          }
          break;
        }

        case ACTION_TYPES.SWITCH_THEME: {
          if (callbacks.updateSetting && config.theme) {
            callbacks.updateSetting('theme', config.theme);
          }
          if (config.notifyTitle) {
            showNotification(config.notifyTitle, config.notifyBody || '');
            playChime('notice');
          }
          break;
        }

        case ACTION_TYPES.AUTO_RESCHEDULE: {
          if (callbacks.rescheduleOverdueTasks) {
            const count = callbacks.rescheduleOverdueTasks(config.rescheduleTo || 'today');
            if (config.notifyTitle) {
              showNotification(
                config.notifyTitle,
                count > 0 ? `Rescheduled ${count} overdue task(s) to Today.` : 'No overdue tasks found.'
              );
              playChime('complete');
            }
          }
          break;
        }

        case ACTION_TYPES.AUTO_PLAN: {
          if (callbacks.setActiveTab) {
            callbacks.setActiveTab('planner');
          }
          if (config.notifyTitle) {
            showNotification(config.notifyTitle, config.notifyBody || '');
            playChime('chime');
          }
          break;
        }

        case ACTION_TYPES.SHOW_NOTIFICATION: {
          showNotification(config.title || rule.title, config.body || '');
          playChime('notice');
          break;
        }

        default:
          console.warn('Unknown automation action type', action.type);
      }

      this.addLog(
        'action_executed',
        `Automated action executed: "${rule.title}"`,
        true,
        rule.title
      );
    } catch (err) {
      this.addLog(
        'action_error',
        `Failed executing "${rule.title}": ${err.message}`,
        false,
        rule.title
      );
    }
  },

  // Test Run an automation on demand
  testRunRule(ruleId, callbacks = {}) {
    const rule = this.getRules().find((r) => r.id === ruleId);
    if (!rule) return;
    this.executeAction(rule.action, rule, callbacks);
  },

  // ----------------------------------------------------------------------
  // Event Evaluators
  // ----------------------------------------------------------------------

  // App Launch Event (e.g. from Quick Launch or active window)
  evaluateAppOpen(appName = '', target = '', callbacks = {}) {
    const query = `${appName} ${target}`.toLowerCase();
    const rules = this.getRules().filter(
      (r) => r.enabled && r.trigger?.type === TRIGGER_TYPES.APP_OPEN
    );

    for (const rule of rules) {
      const matchApp = (rule.trigger.config?.appQuery || '').toLowerCase();
      if (matchApp && query.includes(matchApp)) {
        this.executeAction(rule.action, rule, callbacks);
      }
    }
  },

  // Battery Level Change Event
  evaluateBattery(batteryPercent, isCharging, callbacks = {}) {
    const rules = this.getRules().filter(
      (r) => r.enabled && r.trigger?.type === TRIGGER_TYPES.BATTERY_LEVEL
    );

    for (const rule of rules) {
      const threshold = rule.trigger.config?.threshold || 20;
      const onlyWhenDischarging = rule.trigger.config?.onlyWhenDischarging !== false;

      // Check if threshold met
      if (batteryPercent <= threshold && (!onlyWhenDischarging || !isCharging)) {
        // Debounce: don't trigger more than once every 30 minutes
        const lastRan = rule.lastTriggeredAt || 0;
        if (Date.now() - lastRan > 30 * 60 * 1000) {
          this.executeAction(rule.action, rule, callbacks);
        }
      }
    }
  },

  // Meeting / Upcoming Task Lead-Time Evaluation
  evaluateUpcomingMeetings(tasks = [], callbacks = {}) {
    const todayStr = getLocalDateString();
    const now = new Date();
    const currentMinSinceMidnight = now.getHours() * 60 + now.getMinutes();

    const rules = this.getRules().filter(
      (r) => r.enabled && r.trigger?.type === TRIGGER_TYPES.MEETING_APPROACHING
    );

    for (const rule of rules) {
      const leadMins = rule.trigger.config?.leadMinutes || 30;

      // Find any task due today with dueTime within leadMins
      const upcoming = tasks.find((t) => {
        if (t.completed || t.dueDate !== todayStr || !t.dueTime) return false;
        const [h, m] = t.dueTime.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return false;
        const taskMinSinceMidnight = h * 60 + m;
        const diffMins = taskMinSinceMidnight - currentMinSinceMidnight;
        return diffMins > 0 && diffMins <= leadMins;
      });

      if (upcoming) {
        const lastRan = rule.lastTriggeredAt || 0;
        // Don't trigger more than once every 25 minutes
        if (Date.now() - lastRan > 25 * 60 * 1000) {
          this.executeAction(rule.action, rule, callbacks);
        }
      }
    }
  },

  // Schedule Time Clock Evaluation (runs every 30 seconds)
  evaluateSchedule(callbacks = {}) {
    const now = new Date();
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${currentH}:${currentM}`;
    const dayOfWeek = now.getDay(); // 0 is Sun, 6 is Sat
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    const rules = this.getRules().filter(
      (r) => r.enabled && r.trigger?.type === TRIGGER_TYPES.TIME_SCHEDULE
    );

    for (const rule of rules) {
      const targetTime = rule.trigger.config?.time;
      const weekdaysOnly = Boolean(rule.trigger.config?.weekdaysOnly);

      if (targetTime === timeStr && (!weekdaysOnly || isWeekday)) {
        const lastRan = rule.lastTriggeredAt || 0;
        // Only once per day (at least 60 seconds diff)
        if (Date.now() - lastRan > 70 * 1000) {
          this.executeAction(rule.action, rule, callbacks);
        }
      }
    }
  },
};
