import React, { useState } from 'react';
import {
  Link2,
  GitBranch,
  CheckSquare,
  Calendar,
  FileText,
  Bot,
  Layers,
  ExternalLink,
  Check,
  RefreshCw,
  Plus,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  X,
  Settings,
  Download,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { INTEGRATION_CATEGORIES } from '../services/integrationsService';

export function IntegrationsView({ integrations, onAddTask }) {
  const {
    providers,
    connect,
    disconnect,
    importTask,
    sendTestPing,
    webhookLogs,
  } = integrations;

  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'development' | 'productivity' | 'communication' | 'future'
  const [expandedProviderId, setExpandedProviderId] = useState('github');
  const [configModalProvider, setConfigModalProvider] = useState(null);
  const [formData, setFormData] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [importedItemIds, setImportedItemIds] = useState(new Set());
  const [votedRoadmaps, setVotedRoadmaps] = useState(new Set());

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenConfig = (p) => {
    setConfigModalProvider(p);
    const initial = {};
    if (p.fields) {
      p.fields.forEach((f) => {
        initial[f.key] = p.config?.[f.key] || f.default || '';
      });
    }
    setFormData(initial);
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!configModalProvider) return;
    connect(configModalProvider.id, formData);
    showToast(`Connected ${configModalProvider.name} successfully! 🔗`);
    setConfigModalProvider(null);
  };

  const handleImport = (providerId, item) => {
    importTask(providerId, item, onAddTask);
    setImportedItemIds((prev) => new Set(prev).add(item.id));
    showToast(`📥 Imported "${item.title}" into your tasks!`);
  };

  const handleTestPing = async (providerId) => {
    await sendTestPing(providerId);
    showToast('🚀 Webhook broadcast sent to channel!');
  };

  const handleVoteRoadmap = (providerId) => {
    setVotedRoadmaps((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) next.delete(providerId);
      else next.add(providerId);
      return next;
    });
    showToast('👍 Vote registered for future roadmap!');
  };

  const filteredProviders = providers.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const connectedCount = providers.filter((p) => p.isConnected).length;
  const availableItemsCount = providers
    .filter((p) => p.isConnected && p.sampleItems)
    .reduce((sum, p) => sum + (p.sampleItems?.length || 0), 0);

  // Icon renderer helper
  const renderProviderIcon = (p) => {
    switch (p.iconName) {
      case 'GitBranch':
        return <GitBranch size={16} />;
      case 'CheckSquare':
        return <CheckSquare size={16} />;
      case 'Calendar':
        return <Calendar size={16} />;
      case 'FileText':
        return <FileText size={16} />;
      case 'Bot':
        return <Bot size={16} />;
      default:
        return <Link2 size={16} />;
    }
  };

  return (
    <div className="integrations-view-container animate-fade-in">
      {/* Header Banner */}
      <div className="integrations-top-bar">
        <div>
          <div className="integrations-title-row">
            <div className="integrations-badge-icon">
              <Link2 size={15} />
            </div>
            <h2 className="integrations-main-title">External Integrations Hub</h2>
          </div>
          <p className="integrations-subtitle">
            Connect GitHub, Jira, Trello, Google/Outlook Calendars, Notion, and Slack/Discord webhooks.
          </p>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="integrations-kpi-grid">
        <div className="int-kpi-card">
          <span className="int-kpi-label">Connected Platforms</span>
          <div className="int-kpi-val">
            <strong style={{ color: '#10b981' }}>{connectedCount}</strong>
            <span className="int-kpi-sub">active bridges</span>
          </div>
        </div>

        <div className="int-kpi-card">
          <span className="int-kpi-label">External Items</span>
          <div className="int-kpi-val">
            <strong>{availableItemsCount}</strong>
            <span className="int-kpi-sub">issues & events ready</span>
          </div>
        </div>

        <div className="int-kpi-card">
          <span className="int-kpi-label">Broadcasting</span>
          <div className="int-kpi-val">
            <strong style={{ color: '#8b5cf6' }}>Live</strong>
            <span className="int-kpi-sub">Slack / Teams / Discord</span>
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="int-toast-banner animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Category Pills Navigation */}
      <div className="int-categories-nav">
        <button
          className={`int-nav-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All Hubs ({providers.length})
        </button>
        <button
          className={`int-nav-pill ${activeCategory === INTEGRATION_CATEGORIES.DEV ? 'active' : ''}`}
          onClick={() => setActiveCategory(INTEGRATION_CATEGORIES.DEV)}
        >
          Development (3)
        </button>
        <button
          className={`int-nav-pill ${activeCategory === INTEGRATION_CATEGORIES.PRODUCTIVITY ? 'active' : ''}`}
          onClick={() => setActiveCategory(INTEGRATION_CATEGORIES.PRODUCTIVITY)}
        >
          Productivity (4)
        </button>
        <button
          className={`int-nav-pill ${activeCategory === INTEGRATION_CATEGORIES.COMMUNICATION ? 'active' : ''}`}
          onClick={() => setActiveCategory(INTEGRATION_CATEGORIES.COMMUNICATION)}
        >
          Communication (3)
        </button>
        <button
          className={`int-nav-pill ${activeCategory === INTEGRATION_CATEGORIES.FUTURE ? 'active' : ''}`}
          onClick={() => setActiveCategory(INTEGRATION_CATEGORIES.FUTURE)}
        >
          Future Roadmap (4)
        </button>
      </div>

      {/* Providers Cards Grid */}
      <div className="providers-grid-list">
        {filteredProviders.map((provider) => {
          const isConnected = provider.isConnected;
          const isExpanded = expandedProviderId === provider.id;
          const isFuture = provider.category === INTEGRATION_CATEGORIES.FUTURE;
          const hasVoted = votedRoadmaps.has(provider.id);

          return (
            <div
              key={provider.id}
              className={`provider-deck-card ${isConnected ? 'connected' : ''} ${isFuture ? 'future' : ''}`}
            >
              <div className="provider-deck-top">
                <div
                  className="provider-deck-avatar"
                  style={{ background: provider.color, color: provider.textColor }}
                >
                  {renderProviderIcon(provider)}
                </div>

                <div className="provider-deck-info">
                  <div className="provider-deck-title-row">
                    <strong className="provider-deck-title">{provider.name}</strong>
                    <span
                      className="provider-badge-pill"
                      style={{ background: `${provider.color}25`, color: provider.color }}
                    >
                      {provider.badge}
                    </span>
                    {isConnected && (
                      <span className="connected-dot-pill">
                        <Check size={9} /> Connected
                      </span>
                    )}
                  </div>
                  <p className="provider-deck-desc">{provider.description}</p>
                </div>

                {/* Card Top Action Button */}
                <div className="provider-deck-action">
                  {isFuture ? (
                    <button
                      className={`vote-roadmap-btn ${hasVoted ? 'voted' : ''}`}
                      onClick={() => handleVoteRoadmap(provider.id)}
                    >
                      <ThumbsUp size={11} />
                      <span>{hasVoted ? (provider.votes || 0) + 1 : provider.votes || 0} Votes</span>
                    </button>
                  ) : isConnected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="provider-cfg-btn"
                        onClick={() => handleOpenConfig(provider)}
                        title="Configure settings"
                      >
                        <Settings size={12} />
                      </button>
                      <button
                        className="provider-disconnect-btn"
                        onClick={() => {
                          disconnect(provider.id);
                          showToast(`Disconnected ${provider.name}.`);
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      className="provider-connect-btn"
                      style={{ background: provider.color, color: provider.textColor }}
                      onClick={() => handleOpenConfig(provider)}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Webhook Broadcast Controls (for Slack / Teams / Discord) */}
              {isConnected && provider.isWebhook && (
                <div className="webhook-controls-bar">
                  <span className="webhook-channel-tag">
                    Target: <strong>{provider.config?.channel || '#standup'}</strong>
                  </span>
                  <button
                    className="test-ping-btn"
                    onClick={() => handleTestPing(provider.id)}
                  >
                    <Send size={11} />
                    <span>Send Test Ping</span>
                  </button>
                </div>
              )}

              {/* Expandable Synced Items Drawer (GitHub Issues, Jira, GCal, etc.) */}
              {isConnected && provider.sampleItems && provider.sampleItems.length > 0 && (
                <div className="synced-items-drawer">
                  <div
                    className="drawer-toggle-row"
                    onClick={() => setExpandedProviderId(isExpanded ? null : provider.id)}
                  >
                    <span className="drawer-count-label">
                      Available External Items ({provider.sampleItems.length})
                    </span>
                    <button className="drawer-toggle-arrow">
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="drawer-items-list animate-fade-in">
                      {provider.sampleItems.map((item) => {
                        const isImported = importedItemIds.has(item.id);
                        return (
                          <div key={item.id} className="drawer-item-row">
                            <div className="drawer-item-left">
                              <span
                                className="item-key-badge"
                                style={{ background: `${provider.color}20`, color: provider.color }}
                              >
                                {item.key}
                              </span>
                              <span className="drawer-item-title">{item.title}</span>
                              {item.status && (
                                <span className="drawer-item-status">{item.status}</span>
                              )}
                              {item.time && (
                                <span className="drawer-item-time">{item.time}</span>
                              )}
                            </div>

                            <button
                              className={`import-item-btn ${isImported ? 'imported' : ''}`}
                              onClick={() => handleImport(provider.id, item)}
                              disabled={isImported}
                            >
                              {isImported ? (
                                <>
                                  <Check size={10} /> Imported
                                </>
                              ) : (
                                <>
                                  <Plus size={10} /> Import to Tasks
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Webhook Activity Stream */}
      {webhookLogs && webhookLogs.length > 0 && (
        <div className="webhook-logs-section">
          <div className="logs-header-row">
            <span className="logs-section-title">
              <Clock size={12} className="accent-icon" />
              Webhook Broadcast Activity Stream
            </span>
          </div>
          <div className="webhook-logs-stream">
            {webhookLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="webhook-log-line">
                <span className="log-badge-dot" />
                <span className="log-msg-text">{log.message}</span>
                <span className="log-timestamp">{log.timeFormatted}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {configModalProvider && (
        <div className="modal-overlay" onClick={() => setConfigModalProvider(null)}>
          <div
            className="modal-dialog modal-config-dialog animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: configModalProvider.color,
                    color: configModalProvider.textColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {renderProviderIcon(configModalProvider)}
                </div>
                <h3 className="modal-title">Configure {configModalProvider.name}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setConfigModalProvider(null)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
                {configModalProvider.description}
              </p>

              {configModalProvider.fields?.map((f) => (
                <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    className="form-input"
                    placeholder={f.placeholder}
                    value={formData[f.key] || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, [f.key]: e.target.value })
                    }
                  />
                </div>
              ))}

              <div className="modal-footer" style={{ padding: '8px 0 0', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfigModalProvider(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: configModalProvider.color, color: configModalProvider.textColor }}
                >
                  Connect Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
