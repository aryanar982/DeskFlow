import React, { useState } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  BatteryCharging,
  Code,
  Globe,
  Sparkles,
  RotateCcw,
  Sliders,
  Bell,
  Layers,
  ChevronRight,
  Shield,
  Calendar,
  CalendarClock,
  Laptop,
  Check,
  X,
} from 'lucide-react';
import { TRIGGER_TYPES, ACTION_TYPES } from '../utils/automationEngine';

export function AutomationsView({ automations, onOpenAddTask }) {
  const {
    rules,
    logs,
    overdueTasksCount,
    overdueTasks,
    toggleRule,
    addRule,
    deleteRule,
    resetToDefaults,
    clearLogs,
    testRunRule,
    smartRescheduleOverdue,
  } = automations;

  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'scheduler' | 'logs'
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Rule Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [triggerType, setTriggerType] = useState(TRIGGER_TYPES.APP_OPEN);
  const [appQuery, setAppQuery] = useState('');
  const [batteryThreshold, setBatteryThreshold] = useState(20);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [leadMinutes, setLeadMinutes] = useState(30);

  const [actionType, setActionType] = useState(ACTION_TYPES.FILTER_TASKS);
  const [filterQuery, setFilterQuery] = useState('#dev');
  const [themeSelect, setThemeSelect] = useState('amoled');
  const [notifyTitle, setNotifyTitle] = useState('Automation Triggered! ⚡');
  const [notifyBody, setNotifyBody] = useState('Your automated workflow ran smoothly.');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestRun = (rule) => {
    testRunRule(rule.id);
    showToast(`⚡ Test ran: "${rule.title}"`);
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let triggerConfig = {};
    if (triggerType === TRIGGER_TYPES.APP_OPEN) {
      triggerConfig = { appQuery: appQuery.trim() || 'app' };
    } else if (triggerType === TRIGGER_TYPES.BATTERY_LEVEL) {
      triggerConfig = { threshold: Number(batteryThreshold), onlyWhenDischarging: true };
    } else if (triggerType === TRIGGER_TYPES.TIME_SCHEDULE) {
      triggerConfig = { time: scheduleTime, weekdaysOnly: true };
    } else if (triggerType === TRIGGER_TYPES.MEETING_APPROACHING) {
      triggerConfig = { leadMinutes: Number(leadMinutes) };
    }

    let actionConfig = {};
    if (actionType === ACTION_TYPES.FILTER_TASKS) {
      actionConfig = {
        query: filterQuery.trim() || '#dev',
        notifyTitle: notifyTitle || 'Filtered Tasks',
        notifyBody: notifyBody || '',
      };
    } else if (actionType === ACTION_TYPES.SWITCH_THEME) {
      actionConfig = {
        theme: themeSelect,
        notifyTitle: notifyTitle || 'Theme Changed',
        notifyBody: notifyBody || '',
      };
    } else if (actionType === ACTION_TYPES.ENABLE_FOCUS) {
      actionConfig = {
        tab: 'focus',
        notifyTitle: notifyTitle || 'Focus Mode Started',
        notifyBody: notifyBody || '',
      };
    } else if (actionType === ACTION_TYPES.SHOW_NOTIFICATION) {
      actionConfig = {
        title: notifyTitle,
        body: notifyBody,
      };
    }

    addRule({
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom user automation rule',
      trigger: { type: triggerType, config: triggerConfig },
      action: { type: actionType, config: actionConfig },
    });

    setIsBuilderOpen(false);
    setNewTitle('');
    setNewDesc('');
    showToast(`✅ Created rule: "${newTitle.trim()}"`);
  };

  const handleRescheduleAll = (target = 'today') => {
    const count = smartRescheduleOverdue(target);
    showToast(`📅 Rescheduled ${count} overdue task(s) to ${target === 'today' ? 'Today' : 'Tomorrow'}.`);
  };

  // Rule icon helper
  const getRuleIcon = (rule) => {
    if (rule.trigger?.type === TRIGGER_TYPES.APP_OPEN) {
      const q = (rule.trigger.config?.appQuery || '').toLowerCase();
      if (q.includes('code')) return <Code size={15} color="#0078d4" />;
      if (q.includes('chrome')) return <Globe size={15} color="#ea4335" />;
      return <Laptop size={15} color="var(--accent-primary)" />;
    }
    if (rule.trigger?.type === TRIGGER_TYPES.BATTERY_LEVEL) {
      return <BatteryCharging size={15} color="#10b981" />;
    }
    if (rule.trigger?.type === TRIGGER_TYPES.MEETING_APPROACHING) {
      return <Clock size={15} color="#f59e0b" />;
    }
    if (rule.trigger?.type === TRIGGER_TYPES.TIME_SCHEDULE) {
      return <Calendar size={15} color="#8b5cf6" />;
    }
    if (rule.trigger?.type === TRIGGER_TYPES.TASK_OVERDUE) {
      return <CalendarClock size={15} color="#ec4899" />;
    }
    return <Zap size={15} color="var(--accent-primary)" />;
  };

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalExecutions = rules.reduce((sum, r) => sum + (r.executionCount || 0), 0);

  return (
    <div className="automations-view-container animate-fade-in">
      {/* Header Banner */}
      <div className="automations-top-bar">
        <div>
          <div className="automations-title-row">
            <div className="zap-badge-icon">
              <Zap size={14} className="zap-pulse" />
            </div>
            <h2 className="automations-main-title">Smart Automations</h2>
          </div>
          <p className="automations-subtitle">
            If/Then rules engine, contextual task filtering, and automated scheduling.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="auto-btn-primary"
            onClick={() => setIsBuilderOpen(true)}
            title="Create Custom Rule"
          >
            <Plus size={12} />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="auto-kpi-grid">
        <div className="auto-kpi-card">
          <span className="auto-kpi-label">Active Rules</span>
          <div className="auto-kpi-val">
            <strong>{activeCount}</strong>
            <span className="auto-kpi-sub">/ {rules.length} enabled</span>
          </div>
        </div>

        <div className="auto-kpi-card">
          <span className="auto-kpi-label">Total Executions</span>
          <div className="auto-kpi-val">
            <strong>{totalExecutions}</strong>
            <span className="auto-kpi-sub">triggers fired</span>
          </div>
        </div>

        <div className="auto-kpi-card">
          <span className="auto-kpi-label">Overdue Backlog</span>
          <div className="auto-kpi-val">
            <strong className={overdueTasksCount > 0 ? 'text-danger' : ''}>
              {overdueTasksCount}
            </strong>
            <span className="auto-kpi-sub">tasks overdue</span>
          </div>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="auto-toast-banner animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* View Tabs */}
      <div className="auto-tabs-nav">
        <button
          className={`auto-nav-pill ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Zap size={12} /> Automation Rules ({rules.length})
        </button>
        <button
          className={`auto-nav-pill ${activeTab === 'scheduler' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduler')}
        >
          <CalendarClock size={12} /> Smart Scheduler {overdueTasksCount > 0 && `(${overdueTasksCount})`}
        </button>
        <button
          className={`auto-nav-pill ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Clock size={12} /> Activity Stream ({logs.length})
        </button>
      </div>

      {/* TAB 1: RULES & PRESETS DECK */}
      {activeTab === 'rules' && (
        <div className="auto-rules-list">
          {rules.map((rule) => {
            const isEnabled = rule.enabled;
            return (
              <div
                key={rule.id}
                className={`auto-rule-card ${isEnabled ? 'enabled' : 'disabled'}`}
              >
                <div className="rule-card-top">
                  <div className="rule-icon-box">{getRuleIcon(rule)}</div>
                  <div className="rule-info-col">
                    <div className="rule-title-row">
                      <strong className="rule-title">{rule.title}</strong>
                      {rule.executionCount > 0 && (
                        <span className="rule-count-pill">{rule.executionCount}x</span>
                      )}
                    </div>
                    <p className="rule-desc">{rule.description}</p>
                  </div>

                  {/* Toggle Switch */}
                  <label className="toggle-switch-wrap" title={isEnabled ? 'Disable Rule' : 'Enable Rule'}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleRule(rule.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {/* IF / THEN Connectors */}
                <div className="rule-connectors-row">
                  <div className="connector-chip if-chip">
                    <span className="connector-prefix">IF:</span>
                    <span className="connector-val">
                      {rule.trigger?.type === TRIGGER_TYPES.APP_OPEN
                        ? `Launch "${rule.trigger.config?.appQuery}"`
                        : rule.trigger?.type === TRIGGER_TYPES.BATTERY_LEVEL
                        ? `Battery < ${rule.trigger.config?.threshold}%`
                        : rule.trigger?.type === TRIGGER_TYPES.TIME_SCHEDULE
                        ? `Clock reaches ${rule.trigger.config?.time}`
                        : rule.trigger?.type === TRIGGER_TYPES.MEETING_APPROACHING
                        ? `Meeting in ${rule.trigger.config?.leadMinutes}m`
                        : rule.trigger?.type === TRIGGER_TYPES.TASK_OVERDUE
                        ? 'Task overdue past midnight'
                        : 'Context changes'}
                    </span>
                  </div>

                  <ChevronRight size={12} className="connector-arrow" />

                  <div className="connector-chip then-chip">
                    <span className="connector-prefix">THEN:</span>
                    <span className="connector-val">
                      {rule.action?.type === ACTION_TYPES.FILTER_TASKS
                        ? `Filter "${rule.action.config?.query}"`
                        : rule.action?.type === ACTION_TYPES.SWITCH_THEME
                        ? `Switch to ${rule.action.config?.theme?.toUpperCase()} mode`
                        : rule.action?.type === ACTION_TYPES.ENABLE_FOCUS
                        ? 'Activate Focus Mode'
                        : rule.action?.type === ACTION_TYPES.AUTO_RESCHEDULE
                        ? 'Reschedule to Today'
                        : rule.action?.type === ACTION_TYPES.AUTO_PLAN
                        ? 'Auto-prioritize top 3 tasks'
                        : 'Show notification'}
                    </span>
                  </div>

                  {/* Test Run Action Button */}
                  <div className="rule-actions-right">
                    <button
                      className="test-run-btn"
                      onClick={() => handleTestRun(rule)}
                      title="Simulate / Run rule now"
                    >
                      <Play size={10} />
                      <span>Test</span>
                    </button>
                    {rule.category === 'custom' && (
                      <button
                        className="rule-del-btn"
                        onClick={() => deleteRule(rule.id)}
                        title="Delete custom rule"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <button
              className="reset-presets-link"
              onClick={resetToDefaults}
              title="Restore standard automation presets"
            >
              Reset to Factory Automation Presets
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SMART SCHEDULER & OVERDUE RESOLVER */}
      {activeTab === 'scheduler' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Overdue Backlog Resolver Card */}
          <div className="scheduler-card">
            <div className="scheduler-header">
              <div className="scheduler-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                <CalendarClock size={16} />
              </div>
              <div>
                <strong className="scheduler-title">Smart Overdue Tasks Manager</strong>
                <p className="scheduler-subtitle">
                  Detects tasks with past due dates and rolls them forward without losing priorities or attachments.
                </p>
              </div>
            </div>

            <div className="overdue-status-box">
              {overdueTasksCount === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 11.5 }}>
                  <CheckCircle2 size={16} />
                  <strong>Zero overdue tasks! Your schedule is completely up to date.</strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                      ⚠️ {overdueTasksCount} overdue task(s) require attention:
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="auto-btn-primary"
                        onClick={() => handleRescheduleAll('today')}
                        style={{ fontSize: 10.5, padding: '4px 9px' }}
                      >
                        Move to Today
                      </button>
                      <button
                        className="auto-btn-secondary"
                        onClick={() => handleRescheduleAll('tomorrow')}
                        style={{ fontSize: 10.5, padding: '4px 9px' }}
                      >
                        Move to Tomorrow
                      </button>
                    </div>
                  </div>

                  <div className="overdue-preview-list">
                    {overdueTasks.slice(0, 5).map((t) => (
                      <div key={t.id} className="overdue-preview-item">
                        <span className="overdue-dot" />
                        <span className="overdue-item-title">{t.title}</span>
                        <span className="overdue-item-date">Due: {t.dueDate}</span>
                      </div>
                    ))}
                    {overdueTasksCount > 5 && (
                      <span style={{ fontSize: 9.5, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                        + {overdueTasksCount - 5} more overdue tasks
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Daily AI Prioritization Automation */}
          <div className="scheduler-card">
            <div className="scheduler-header">
              <div className="scheduler-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                <Sparkles size={16} />
              </div>
              <div>
                <strong className="scheduler-title">Morning Daily Planning Automation</strong>
                <p className="scheduler-subtitle">
                  Automatically extracts the top 3 highest-leverage tasks every morning at 9:00 AM.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                Scheduled Execution: <strong>Daily at 09:00 AM</strong>
              </span>
              <button
                className="auto-btn-secondary"
                onClick={() => {
                  testRunRule('preset-daily-plan');
                  showToast('🌅 Daily planning automation triggered!');
                }}
                style={{ fontSize: 10.5, padding: '4px 9px' }}
              >
                Run Planner Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT STREAM */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Execution Stream & History
            </span>
            {logs.length > 0 && (
              <button className="clear-logs-btn" onClick={clearLogs}>
                Clear History
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="empty-auto-state">
              <Zap size={24} style={{ opacity: 0.35, marginBottom: 4 }} />
              <p>No automations fired yet.</p>
              <span>Trigger a rule using "Test" or wait for real conditions to execute.</span>
            </div>
          ) : (
            <div className="auto-logs-stream">
              {logs.map((log) => (
                <div key={log.id} className="auto-log-item">
                  <span className={`log-dot ${log.success ? 'success' : 'warn'}`} />
                  <div className="log-col">
                    <span className="log-msg">{log.message}</span>
                    <span className="log-time">
                      {log.dateFormatted} at {log.timeFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Rule Builder Modal */}
      {isBuilderOpen && (
        <div className="modal-overlay" onClick={() => setIsBuilderOpen(false)}>
          <div
            className="modal-dialog modal-rule-builder animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={16} style={{ color: 'var(--accent-primary)' }} />
                <h3 className="modal-title">Create Smart Automation Rule</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsBuilderOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="rule-builder-form">
              <div className="form-group">
                <label className="form-label">Rule Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Open Spotify → Focus Session"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              {/* IF Section */}
              <div className="builder-section-box">
                <span className="builder-badge if-badge">IF (Trigger Condition)</span>
                <div className="form-group" style={{ marginTop: 6 }}>
                  <select
                    className="form-select"
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                  >
                    <option value={TRIGGER_TYPES.APP_OPEN}>App Launched or Focused</option>
                    <option value={TRIGGER_TYPES.BATTERY_LEVEL}>Battery Level Threshold</option>
                    <option value={TRIGGER_TYPES.TIME_SCHEDULE}>Time of Day Clock</option>
                    <option value={TRIGGER_TYPES.MEETING_APPROACHING}>Meeting or Due Task Approaching</option>
                  </select>
                </div>

                {triggerType === TRIGGER_TYPES.APP_OPEN && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">App Name / Keyword</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Figma, Terminal, Slack, Spotify"
                      value={appQuery}
                      onChange={(e) => setAppQuery(e.target.value)}
                      required
                    />
                  </div>
                )}

                {triggerType === TRIGGER_TYPES.BATTERY_LEVEL && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">When Battery drops below {batteryThreshold}%</label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={batteryThreshold}
                      onChange={(e) => setBatteryThreshold(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                )}

                {triggerType === TRIGGER_TYPES.TIME_SCHEDULE && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Schedule Time (24-Hour)</label>
                    <input
                      type="time"
                      className="form-input"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required
                    />
                  </div>
                )}

                {triggerType === TRIGGER_TYPES.MEETING_APPROACHING && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Lead Time Before Due Date: {leadMinutes} mins</label>
                    <select
                      className="form-select"
                      value={leadMinutes}
                      onChange={(e) => setLeadMinutes(e.target.value)}
                    >
                      <option value={15}>15 Minutes Before</option>
                      <option value={30}>30 Minutes Before</option>
                      <option value={45}>45 Minutes Before</option>
                      <option value={60}>1 Hour Before</option>
                    </select>
                  </div>
                )}
              </div>

              {/* THEN Section */}
              <div className="builder-section-box">
                <span className="builder-badge then-badge">THEN (Action to Execute)</span>
                <div className="form-group" style={{ marginTop: 6 }}>
                  <select
                    className="form-select"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    <option value={ACTION_TYPES.FILTER_TASKS}>Filter Tasks List (by tag/query)</option>
                    <option value={ACTION_TYPES.ENABLE_FOCUS}>Enable Focus Mode (Pomodoro)</option>
                    <option value={ACTION_TYPES.SWITCH_THEME}>Switch Theme Aesthetic</option>
                    <option value={ACTION_TYPES.SHOW_NOTIFICATION}>Show Desktop Notification</option>
                  </select>
                </div>

                {actionType === ACTION_TYPES.FILTER_TASKS && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Omnibox Filter Query</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. #dev, #design, @Work, !urgent"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      required
                    />
                  </div>
                )}

                {actionType === ACTION_TYPES.SWITCH_THEME && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Target Theme</label>
                    <select
                      className="form-select"
                      value={themeSelect}
                      onChange={(e) => setThemeSelect(e.target.value)}
                    >
                      <option value="amoled">AMOLED (Pure Black)</option>
                      <option value="minimal">Minimal (Zen Monochrome)</option>
                      <option value="windows11">Windows 11 (Fluent 2)</option>
                      <option value="glass">Glass (Crystalline)</option>
                      <option value="cyberpunk">Cyberpunk (Neon)</option>
                      <option value="material">Material Design 3</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: 8, marginBottom: 0 }}>
                  <label className="form-label">Notification Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBuilderOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
