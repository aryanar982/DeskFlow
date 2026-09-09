import { getLocalDateString } from '../utils/dateUtils.js';
import { playChime, showNotification } from './notifications.js';

const STORAGE_KEYS = {
  CONFIG: 'deskflow_integrations_config_v1',
  LOGS: 'deskflow_webhook_logs_v1',
};

export const INTEGRATION_CATEGORIES = {
  DEV: 'development',
  PRODUCTIVITY: 'productivity',
  COMMUNICATION: 'communication',
  FUTURE: 'future',
};

export const PROVIDERS = [
  // --- Development ---
  {
    id: 'github',
    name: 'GitHub Issues',
    category: INTEGRATION_CATEGORIES.DEV,
    badge: 'GitHub',
    color: '#24292e',
    textColor: '#ffffff',
    iconName: 'GitBranch',
    description: 'Sync repository issues, track PRs, and convert GitHub issues into DeskFlow tasks.',
    fields: [
      { key: 'repo', label: 'Repository (owner/repo)', placeholder: 'aryan/deskflow', default: 'aryan/deskflow' },
      { key: 'token', label: 'Personal Access Token (optional)', placeholder: 'ghp_...', type: 'password' },
    ],
    sampleItems: [
      { id: 'gh-104', key: '#104', title: 'Refine Mica acrylic backdrop reflections on Windows 11', status: 'open', label: 'enhancement', category: 'Dev' },
      { id: 'gh-108', key: '#108', title: 'Fix multi-monitor DPI scaling when dragging across displays', status: 'open', label: 'bug', category: 'Dev' },
      { id: 'gh-112', key: '#112', title: 'Implement automated GitHub Actions release CI/CD workflow', status: 'open', label: 'devops', category: 'Dev' },
      { id: 'gh-115', key: '#115', title: 'Add keyboard shortcut cheatsheet modal (Alt+M / Alt+C)', status: 'closed', label: 'feature', category: 'Dev' },
    ],
  },
  {
    id: 'jira',
    name: 'Jira Software',
    category: INTEGRATION_CATEGORIES.DEV,
    badge: 'Jira',
    color: '#0052cc',
    textColor: '#ffffff',
    iconName: 'CheckSquare',
    description: 'Track sprint user stories, bug tickets, and velocity directly from Atlassian Jira Cloud.',
    fields: [
      { key: 'domain', label: 'Jira Domain', placeholder: 'your-company.atlassian.net', default: 'acme.atlassian.net' },
      { key: 'project', label: 'Project Key', placeholder: 'DESK', default: 'DESK' },
      { key: 'apiToken', label: 'Jira API Token', placeholder: 'API token...', type: 'password' },
    ],
    sampleItems: [
      { id: 'jira-101', key: 'DESK-101', title: 'Native IPC hardware monitors for CPU and RAM', status: 'In Progress', points: 5, category: 'Work' },
      { id: 'jira-102', key: 'DESK-102', title: 'Pomodoro timer audio chime notification dispatch', status: 'Done', points: 3, category: 'Work' },
      { id: 'jira-105', key: 'DESK-105', title: 'Cloud sync bi-directional conflict resolution engine', status: 'To Do', points: 8, category: 'Work' },
    ],
  },
  {
    id: 'trello',
    name: 'Trello Boards',
    category: INTEGRATION_CATEGORIES.DEV,
    badge: 'Trello',
    color: '#0079bf',
    textColor: '#ffffff',
    iconName: 'Trello',
    description: 'Access Kanban boards, move cards across lists, and manage agile team workflows.',
    fields: [
      { key: 'boardName', label: 'Board Name', placeholder: 'DeskFlow Sprint Board', default: 'DeskFlow Sprint Board' },
      { key: 'apiKey', label: 'Trello API Key', placeholder: 'Key...', type: 'password' },
    ],
    sampleItems: [
      { id: 'trello-201', key: 'CARD-201', title: 'Design Figma tokens for Windows 11 Fluent 2 spec', list: 'Doing', category: 'Design' },
      { id: 'trello-202', key: 'CARD-202', title: 'Audit localStorage schema version migrations', list: 'To Do', category: 'Dev' },
      { id: 'trello-203', key: 'CARD-203', title: 'Test battery status change events on laptops', list: 'Done', category: 'Dev' },
    ],
  },

  // --- Productivity ---
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    badge: 'Google',
    color: '#4285f4',
    textColor: '#ffffff',
    iconName: 'Calendar',
    description: 'Sync meetings, deadlines, and schedule commitments directly into DeskFlow Calendar.',
    fields: [
      { key: 'calendarName', label: 'Calendar Name', placeholder: 'Work Calendar', default: 'Primary Work Calendar' },
      { key: 'syncInterval', label: 'Sync Interval (mins)', placeholder: '15', default: '15' },
    ],
    sampleItems: [
      { id: 'gcal-301', key: 'GCAL', title: 'Sprint Backlog Grooming & Planning', time: '11:00 AM', duration: '45m', category: 'Work' },
      { id: 'gcal-302', key: 'GCAL', title: 'DeskFlow UI Design Review & Live Demo', time: '03:30 PM', duration: '30m', category: 'Design' },
      { id: 'gcal-303', key: 'GCAL', title: '1-on-1 Engineering Sync Call', time: '05:00 PM', duration: '30m', category: 'Work' },
    ],
  },
  {
    id: 'outlook',
    name: 'Outlook Calendar',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    badge: 'Outlook',
    color: '#0078d4',
    textColor: '#ffffff',
    iconName: 'Calendar',
    description: 'Integrate Microsoft 365 Exchange meetings, appointments, and RSVP invites.',
    fields: [
      { key: 'accountEmail', label: 'Microsoft 365 Email', placeholder: 'user@organization.com', default: 'aryan@microsoft365.live.com' },
    ],
    sampleItems: [
      { id: 'out-401', key: 'OUTLOOK', title: 'Weekly Product Strategy & Review', time: '10:00 AM', duration: '60m', category: 'Work' },
      { id: 'out-402', key: 'OUTLOOK', title: 'Architecture Review: SQLite / IndexedDB Storage', time: '02:00 PM', duration: '45m', category: 'Dev' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion Database',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    badge: 'Notion',
    color: '#000000',
    textColor: '#ffffff',
    iconName: 'FileText',
    description: 'Connect Notion workspaces, pull database pages, and sync bidirectional task properties.',
    fields: [
      { key: 'databaseId', label: 'Notion Database ID / URL', placeholder: 'notion.so/my-workspace/...', default: 'Product Roadmap 2026' },
      { key: 'apiKey', label: 'Internal Integration Secret', placeholder: 'secret_...', type: 'password' },
    ],
    sampleItems: [
      { id: 'notion-501', key: 'NOTION', title: 'v6.0 External Integrations Technical Architecture Spec', status: 'In Review', category: 'Dev' },
      { id: 'notion-502', key: 'NOTION', title: 'Desktop Widget Performance & Latency Benchmarks', status: 'Drafting', category: 'Research' },
    ],
  },
  {
    id: 'ms_todo',
    name: 'Microsoft To Do',
    category: INTEGRATION_CATEGORIES.PRODUCTIVITY,
    badge: 'MS To Do',
    color: '#2564cf',
    textColor: '#ffffff',
    iconName: 'CheckSquare',
    description: 'Sync your Microsoft To Do lists, My Day items, and Outlook flagged emails.',
    fields: [
      { key: 'listName', label: 'Target List', placeholder: 'Tasks', default: 'Planned Tasks' },
    ],
    sampleItems: [
      { id: 'todo-601', key: 'MS-TODO', title: 'Review pull request feedback from team', category: 'Dev' },
      { id: 'todo-602', key: 'MS-TODO', title: 'Prepare weekly productivity summary report', category: 'Work' },
    ],
  },

  // --- Communication ---
  {
    id: 'slack',
    name: 'Slack Workspaces',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    badge: 'Slack',
    color: '#4a154b',
    textColor: '#ffffff',
    iconName: 'Bot',
    description: 'Post task completions, daily standup check-ins, and focus milestone alerts to Slack channels.',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...', default: 'https://hooks.slack.com/services/SIMULATED/SLACK/WEBHOOK' },
      { key: 'channel', label: 'Channel Name', placeholder: '#standup', default: '#standup' },
    ],
    isWebhook: true,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    badge: 'Teams',
    color: '#6264a7',
    textColor: '#ffffff',
    iconName: 'Bot',
    description: 'Broadcast task milestones and daily progress updates directly into Microsoft Teams channels.',
    fields: [
      { key: 'webhookUrl', label: 'Teams Incoming Webhook URL', placeholder: 'https://outlook.office.com/webhook/...', default: 'https://outlook.office.com/webhook/SIMULATED/TEAMS/WEBHOOK' },
      { key: 'channel', label: 'Team Channel', placeholder: 'General Updates', default: 'General Updates' },
    ],
    isWebhook: true,
  },
  {
    id: 'discord',
    name: 'Discord Webhook Bot',
    category: INTEGRATION_CATEGORIES.COMMUNICATION,
    badge: 'Discord',
    color: '#5865f2',
    textColor: '#ffffff',
    iconName: 'Bot',
    description: 'Send celebration pings when tasks or Pomodoro focus sprints are completed.',
    fields: [
      { key: 'webhookUrl', label: 'Discord Webhook URL', placeholder: 'https://discord.com/api/webhooks/...', default: 'https://discord.com/api/webhooks/SIMULATED/DISCORD/WEBHOOK' },
      { key: 'channel', label: 'Channel / Server', placeholder: '#productivity-log', default: '#productivity-log' },
    ],
    isWebhook: true,
  },

  // --- Future Roadmap ---
  {
    id: 'obsidian',
    name: 'Obsidian Vault Sync',
    category: INTEGRATION_CATEGORIES.FUTURE,
    badge: 'Obsidian',
    color: '#7c3aed',
    textColor: '#ffffff',
    iconName: 'FileText',
    description: 'Two-way markdown synchronization with local Obsidian vaults and Daily Notes.',
    votes: 248,
    status: 'coming_soon',
  },
  {
    id: 'todoist',
    name: 'Todoist API Sync',
    category: INTEGRATION_CATEGORIES.FUTURE,
    badge: 'Todoist',
    color: '#e44332',
    textColor: '#ffffff',
    iconName: 'CheckSquare',
    description: 'Sync Karma points, filters, priority flags (P1-P4), and natural language tasks.',
    votes: 312,
    status: 'coming_soon',
  },
  {
    id: 'clickup',
    name: 'ClickUp Workspaces',
    category: INTEGRATION_CATEGORIES.FUTURE,
    badge: 'ClickUp',
    color: '#7b68ee',
    textColor: '#ffffff',
    iconName: 'CheckSquare',
    description: 'Seamless integration with ClickUp Spaces, Folders, and Sprint Backlogs.',
    votes: 184,
    status: 'coming_soon',
  },
  {
    id: 'asana',
    name: 'Asana Projects',
    category: INTEGRATION_CATEGORIES.FUTURE,
    badge: 'Asana',
    color: '#f06a6a',
    textColor: '#ffffff',
    iconName: 'CheckSquare',
    description: 'Sync cross-functional Asana project boards, milestones, and assigned tasks.',
    votes: 142,
    status: 'coming_soon',
  },
];

const listeners = new Set();
function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in integrations subscriber', e);
    }
  });
}

export const integrationsService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // ----------------------------------------------------------------------
  // Configuration Storage
  // ----------------------------------------------------------------------
  getConfigs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (!raw) {
        // Default connected state for simulated demonstration
        return {
          github: { connected: true, repo: 'aryan/deskflow', lastSyncedAt: Date.now() - 3600000 },
          google_calendar: { connected: true, calendarName: 'Primary Work Calendar', lastSyncedAt: Date.now() - 1800000 },
          slack: { connected: true, channel: '#standup', broadcastOnTaskComplete: true, lastSyncedAt: Date.now() - 7200000 },
        };
      }
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  setConfigs(configs) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configs));
    notifySubscribers();
  },

  connectProvider(providerId, userConfig = {}) {
    const configs = this.getConfigs();
    configs[providerId] = {
      ...(configs[providerId] || {}),
      ...userConfig,
      connected: true,
      connectedAt: Date.now(),
      lastSyncedAt: Date.now(),
    };
    this.setConfigs(configs);
    this.addWebhookLog(providerId, `Connected integration "${providerId}" successfully.`, true);
    return configs[providerId];
  },

  disconnectProvider(providerId) {
    const configs = this.getConfigs();
    if (configs[providerId]) {
      configs[providerId].connected = false;
    }
    this.setConfigs(configs);
    this.addWebhookLog(providerId, `Disconnected integration "${providerId}".`, true);
  },

  // ----------------------------------------------------------------------
  // External Items Fetching & Sync
  // ----------------------------------------------------------------------
  getItemsForProvider(providerId) {
    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider || !provider.sampleItems) return [];
    return provider.sampleItems;
  },

  // Import an external issue/meeting/ticket into DeskFlow tasks schema
  convertItemToTask(providerId, item) {
    const provider = PROVIDERS.find((p) => p.id === providerId);
    const todayStr = getLocalDateString();

    return {
      title: item.title,
      description: `Imported from ${provider?.name || providerId} (${item.key || item.id}).`,
      priority: item.label === 'bug' || item.points >= 8 ? 'urgent' : item.points >= 5 ? 'high' : 'medium',
      category: item.category || 'Work',
      tags: [provider?.badge || 'Integration', item.label || item.key || 'External'].filter(Boolean),
      dueDate: todayStr,
      dueTime: item.time ? '12:00' : '17:00',
      externalSource: {
        providerId,
        providerName: provider?.name,
        badge: provider?.badge,
        color: provider?.color,
        key: item.key || item.id,
      },
    };
  },

  // ----------------------------------------------------------------------
  // Webhook Event Broadcasting (Slack / Teams / Discord)
  // ----------------------------------------------------------------------
  getWebhookLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addWebhookLog(providerId, message, success = true) {
    const logs = this.getWebhookLogs();
    const entry = {
      id: 'wlog-' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: getLocalDateString(),
      providerId,
      message,
      success,
    };
    const updated = [entry, ...logs].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    notifySubscribers();
    return entry;
  },

  async broadcastEvent(eventName, payload = {}) {
    const configs = this.getConfigs();
    const webhookProviders = ['slack', 'teams', 'discord'];

    for (const pId of webhookProviders) {
      const cfg = configs[pId];
      if (cfg && cfg.connected) {
        let msg = '';
        if (eventName === 'task_completed') {
          msg = `Task completed in DeskFlow: "${payload.taskTitle || 'Untitled'}" [Category: ${payload.category || 'Work'}] 🎉`;
        } else if (eventName === 'focus_completed') {
          msg = `Focus session completed: ${payload.durationMinutes || 25} minutes of Deep Work 🍅`;
        } else if (eventName === 'test_ping') {
          msg = `DeskFlow Webhook Test verified for channel ${cfg.channel || '#general'}! ✅`;
        }

        // Simulate network dispatch with realistic latency
        this.addWebhookLog(pId, `Dispatched event "${eventName}" to ${cfg.channel || 'channel'}: ${msg}`, true);

        // If real fetch is desired and url looks real
        if (cfg.webhookUrl && cfg.webhookUrl.startsWith('http') && !cfg.webhookUrl.includes('SIMULATED')) {
          try {
            fetch(cfg.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: msg, content: msg }),
              mode: 'no-cors',
            }).catch(() => {});
          } catch (_) {}
        }
      }
    }
  },

  // Test webhook ping
  async sendTestPing(providerId) {
    const configs = this.getConfigs();
    const cfg = configs[providerId] || {};
    const channel = cfg.channel || '#standup';

    await new Promise((r) => setTimeout(r, 450));
    this.addWebhookLog(
      providerId,
      `Sent test ping to ${channel}: "Hello from DeskFlow Desktop Widget v6.0!"`,
      true
    );
    showNotification('Webhook Test Ping Sent! 🚀', `Verification message sent to ${channel}.`);
    playChime('chime');
  },
};
