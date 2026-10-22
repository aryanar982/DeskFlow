import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  X,
  PieChart,
  ArrowUpRight,
  TrendingUp,
  Info,
  SlidersHorizontal,
  PauseCircle,
} from 'lucide-react';
import {
  getAppInfo,
  formatTime,
  formatDateKey,
  parseDateKey,
  formatDateLabel,
  APP_CATEGORIES,
  wellbeingStorage,
} from '../services/wellbeingService';

export function DigitalWellbeingView() {
  const [historyData, setHistoryData] = useState({ days: {} });
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()));
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [slideDirection, setSlideDirection] = useState('none'); // 'left' | 'right' | 'none'
  const [sortBy, setSortBy] = useState('usage'); // 'usage' | 'name'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Load wellbeing data on mount
  useEffect(() => {
    let isMounted = true;
    wellbeingStorage.load().then((data) => {
      if (isMounted && data && data.days) {
        setHistoryData(data);
      }
    });

    // Listen to real-time ticks from Electron IPC if running in Electron
    if (typeof window !== 'undefined' && window.deskflowAPI?.wellbeing?.onUsageTick) {
      const cleanup = window.deskflowAPI.wellbeing.onUsageTick(({ todayKey, data }) => {
        if (!isMounted) return;
        setHistoryData((prev) => {
          const nextDays = { ...(prev.days || {}), [todayKey]: data };
          return { ...prev, days: nextDays };
        });
      });
      return () => {
        isMounted = false;
        cleanup();
      };
    }
  }, []);

  // Current day data
  const currentDayData = useMemo(() => {
    return historyData.days[selectedDateKey] || {
      date: selectedDateKey,
      totalScreenTime: 0,
      totalIdleTime: 0,
      apps: {},
    };
  }, [historyData, selectedDateKey]);

  // Yesterday date key & data for comparison
  const yesterdayKey = useMemo(() => {
    const d = parseDateKey(selectedDateKey);
    d.setDate(d.getDate() - 1);
    return formatDateKey(d);
  }, [selectedDateKey]);

  const yesterdayData = historyData.days[yesterdayKey] || { totalScreenTime: 0 };

  // Screen time delta vs yesterday
  const timeDifferenceText = useMemo(() => {
    const diff = currentDayData.totalScreenTime - yesterdayData.totalScreenTime;
    if (Math.abs(diff) < 60) return 'Same as previous day';
    const formatted = formatTime(Math.abs(diff));
    return diff > 0 ? `+${formatted} vs previous day` : `-${formatted} vs previous day`;
  }, [currentDayData, yesterdayData]);

  // Navigation handlers
  const handlePrevDay = () => {
    setSlideDirection('right');
    const d = parseDateKey(selectedDateKey);
    d.setDate(d.getDate() - 1);
    setSelectedDateKey(formatDateKey(d));
  };

  const handleNextDay = () => {
    const today = formatDateKey(new Date());
    if (selectedDateKey === today) return;
    setSlideDirection('left');
    const d = parseDateKey(selectedDateKey);
    d.setDate(d.getDate() + 1);
    setSelectedDateKey(formatDateKey(d));
  };

  const handleSelectToday = () => {
    setSlideDirection('left');
    setSelectedDateKey(formatDateKey(new Date()));
  };

  const isToday = selectedDateKey === formatDateKey(new Date());

  // Processed list of applications for the selected date (excluding DeskFlow itself)
  const processedApps = useMemo(() => {
    const rawApps = currentDayData.apps || {};
    const list = Object.keys(rawApps)
      .filter((procName) => !procName.includes('deskflow') && procName.toLowerCase() !== 'electron')
      .map((procName) => {
        const record = rawApps[procName];
        const appInfo = getAppInfo(procName);
        return {
          id: procName,
          name: appInfo.displayName,
          procName,
          totalSeconds: record.totalSeconds || 0,
          hourlyUsage: record.hourlyUsage || Array(24).fill(0),
          sessions: record.sessions || [],
          appInfo,
        };
      });

    // Filter by Category if selected
    let filtered = list;
    if (categoryFilter !== 'ALL') {
      filtered = list.filter((item) => item.appInfo.categoryKey === categoryFilter);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => b.totalSeconds - a.totalSeconds);
    }

    return filtered;
  }, [currentDayData, sortBy, categoryFilter]);

  // Top app of the day
  const topApp = processedApps.length > 0 ? processedApps[0] : null;

  // Category breakdown metrics
  const categoryBreakdown = useMemo(() => {
    const totals = {};
    const totalSecs = currentDayData.totalScreenTime || 1;

    Object.values(currentDayData.apps || {}).forEach((app) => {
      const procName = (app.name || '').toLowerCase();
      if (procName.includes('deskflow') || procName === 'electron') return;

      const info = getAppInfo(procName);
      const catKey = info.categoryKey;
      totals[catKey] = (totals[catKey] || 0) + (app.totalSeconds || 0);
    });

    return Object.keys(totals).map((catKey) => {
      const cat = APP_CATEGORIES[catKey] || APP_CATEGORIES.OTHER;
      const secs = totals[catKey];
      const percent = Math.round((secs / totalSecs) * 100);
      return {
        key: catKey,
        name: cat.name,
        color: cat.color,
        bg: cat.bg,
        seconds: secs,
        percent,
      };
    }).sort((a, b) => b.seconds - a.seconds);
  }, [currentDayData]);

  // Rolling 7-Day History for Weekly Chart
  const weeklyHistory = useMemo(() => {
    const result = [];
    const baseDate = parseDateKey(selectedDateKey);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const k = formatDateKey(d);
      const dayData = historyData.days[k] || { totalScreenTime: 0 };
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      result.push({
        dateKey: k,
        dayLabel,
        totalSeconds: dayData.totalScreenTime || 0,
        isSelected: k === selectedDateKey,
      });
    }

    const maxSecs = Math.max(...result.map((r) => r.totalSeconds), 3600);
    return result.map((r) => ({
      ...r,
      heightPercent: Math.min(100, Math.max(12, Math.round((r.totalSeconds / maxSecs) * 100))),
    }));
  }, [historyData, selectedDateKey]);

  // Selected App detail record
  const selectedAppDetail = useMemo(() => {
    if (!selectedAppId) return null;
    const rawApps = currentDayData.apps || {};
    const record = rawApps[selectedAppId];
    if (!record) return null;
    const appInfo = getAppInfo(selectedAppId);
    const dayTotal = currentDayData.totalScreenTime || 1;
    const percent = Math.round(((record.totalSeconds || 0) / dayTotal) * 100);

    return {
      id: selectedAppId,
      name: appInfo.displayName,
      totalSeconds: record.totalSeconds || 0,
      hourlyUsage: record.hourlyUsage || Array(24).fill(0),
      sessions: record.sessions || [],
      appInfo,
      percent,
    };
  }, [selectedAppId, currentDayData]);

  return (
    <div className="wellbeing-container">
      {/* HEADER & DATE SWITCHER */}
      <div className="wellbeing-header-card">
        <div className="wellbeing-title-row">
          <div className="wellbeing-title-badge">
            <Activity size={16} className="text-accent" />
            <span className="wellbeing-title-text">Digital Wellbeing</span>
          </div>

          {!isToday && (
            <button
              className="wellbeing-today-btn"
              onClick={handleSelectToday}
              title="Return to Today"
            >
              <Calendar size={12} />
              <span>Today</span>
            </button>
          )}
        </div>

        {/* Date Navigator Slider */}
        <div className="wellbeing-date-navigator">
          <button
            className="wellbeing-nav-arrow"
            onClick={handlePrevDay}
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div className={`wellbeing-date-display slide-${slideDirection}`}>
            <span className="wellbeing-date-main">{formatDateLabel(selectedDateKey)}</span>
            <span className="wellbeing-date-sub">{selectedDateKey}</span>
          </div>

          <button
            className={`wellbeing-nav-arrow ${isToday ? 'disabled' : ''}`}
            onClick={handleNextDay}
            disabled={isToday}
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* HERO STATS GRID */}
      <div className="wellbeing-stats-grid">
        {/* Card 1: Total Screen Time */}
        <div className="wellbeing-stat-card primary-glow">
          <div className="wellbeing-stat-header">
            <Clock size={14} className="wellbeing-stat-icon" />
            <span>Total Screen Time</span>
          </div>
          <div className="wellbeing-stat-value">
            {formatTime(currentDayData.totalScreenTime)}
          </div>
          <div className="wellbeing-stat-sub text-tertiary">
            <TrendingUp size={11} className="inline-icon" />
            <span>{timeDifferenceText}</span>
          </div>
        </div>

        {/* Card 2: Top App */}
        <div className="wellbeing-stat-card">
          <div className="wellbeing-stat-header">
            <Sparkles size={14} className="wellbeing-stat-icon" />
            <span>Most Used App</span>
          </div>
          <div className="wellbeing-stat-value truncate">
            {topApp ? topApp.name : 'None'}
          </div>
          <div className="wellbeing-stat-sub text-tertiary">
            {topApp ? formatTime(topApp.totalSeconds) : '0m active'}
          </div>
        </div>

        {/* Card 3: Idle / Inactive Time */}
        <div className="wellbeing-stat-card">
          <div className="wellbeing-stat-header">
            <PauseCircle size={14} className="wellbeing-stat-icon" />
            <span>Excluded Idle Time</span>
          </div>
          <div className="wellbeing-stat-value">
            {formatTime(currentDayData.totalIdleTime)}
          </div>
          <div className="wellbeing-stat-sub text-tertiary">
            <span>AFK / Inactivity pauses</span>
          </div>
        </div>
      </div>

      {/* WEEKLY & HOURLY CHARTS SECTION */}
      <div className="wellbeing-card-panel">
        <div className="wellbeing-panel-header">
          <div className="wellbeing-panel-title">
            <BarChart3 size={15} />
            <span>Daily Screen-Time Overview</span>
          </div>
          <span className="wellbeing-badge-sm">7-Day Trend</span>
        </div>

        {/* Weekly Bar Chart */}
        <div className="wellbeing-chart-bars">
          {weeklyHistory.map((item) => (
            <div
              key={item.dateKey}
              className={`wellbeing-bar-col ${item.isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSlideDirection(item.dateKey < selectedDateKey ? 'right' : 'left');
                setSelectedDateKey(item.dateKey);
              }}
              title={`${formatDateLabel(item.dateKey)}: ${formatTime(item.totalSeconds)}`}
            >
              <div className="wellbeing-bar-val">{formatTime(item.totalSeconds)}</div>
              <div className="wellbeing-bar-track">
                <div
                  className="wellbeing-bar-fill"
                  style={{ height: `${item.heightPercent}%` }}
                />
              </div>
              <div className="wellbeing-bar-label">{item.dayLabel}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN BAR */}
      {categoryBreakdown.length > 0 && (
        <div className="wellbeing-card-panel">
          <div className="wellbeing-panel-header">
            <div className="wellbeing-panel-title">
              <PieChart size={15} />
              <span>Category Distribution</span>
            </div>
            <span className="wellbeing-badge-sm">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="wellbeing-multi-progress">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.key}
                className="wellbeing-progress-segment"
                style={{
                  width: `${cat.percent}%`,
                  backgroundColor: cat.color,
                }}
                title={`${cat.name}: ${cat.percent}% (${formatTime(cat.seconds)})`}
              />
            ))}
          </div>

          <div className="wellbeing-category-legend">
            {categoryBreakdown.map((cat) => (
              <div key={cat.key} className="wellbeing-legend-item">
                <span className="wellbeing-legend-dot" style={{ backgroundColor: cat.color }} />
                <span className="wellbeing-legend-name">{cat.name}</span>
                <span className="wellbeing-legend-val">{cat.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPLICATION USAGE LIST */}
      <div className="wellbeing-card-panel">
        <div className="wellbeing-panel-header flex-between">
          <div className="wellbeing-panel-title">
            <Layers size={15} />
            <span>Applications ({processedApps.length})</span>
          </div>

          <div className="wellbeing-filter-group">
            <button
              className={`wellbeing-filter-btn ${sortBy === 'usage' ? 'active' : ''}`}
              onClick={() => setSortBy('usage')}
            >
              Highest Usage
            </button>
            <button
              className={`wellbeing-filter-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => setSortBy('name')}
            >
              Name
            </button>
          </div>
        </div>

        {processedApps.length === 0 ? (
          <div className="wellbeing-empty-state">
            <Info size={24} className="text-tertiary" />
            <p>No active desktop application usage recorded for this date.</p>
          </div>
        ) : (
          <div className="wellbeing-app-list">
            {processedApps.map((app) => {
              const { Icon, color, category } = app.appInfo;
              const maxSecs = topApp ? topApp.totalSeconds : 1;
              const barPercent = Math.min(100, Math.max(4, Math.round((app.totalSeconds / maxSecs) * 100)));

              return (
                <div
                  key={app.id}
                  className="wellbeing-app-row"
                  onClick={() => setSelectedAppId(app.id)}
                >
                  <div className="wellbeing-app-icon-wrap" style={{ backgroundColor: `${color}18`, color }}>
                    <Icon size={18} />
                  </div>

                  <div className="wellbeing-app-info">
                    <div className="wellbeing-app-name-row">
                      <span className="wellbeing-app-name">{app.name}</span>
                      <span className="wellbeing-app-cat-tag" style={{ color: category.color }}>
                        {category.name}
                      </span>
                    </div>

                    <div className="wellbeing-app-bar-wrap">
                      <div
                        className="wellbeing-app-bar-fill"
                        style={{ width: `${barPercent}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>

                  <div className="wellbeing-app-meta">
                    <span className="wellbeing-app-time">{formatTime(app.totalSeconds)}</span>
                    <ArrowUpRight size={14} className="wellbeing-row-chevron" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPLICATION DETAIL MODAL / DRAWER */}
      {selectedAppDetail && (
        <div className="wellbeing-modal-overlay" onClick={() => setSelectedAppId(null)}>
          <div className="wellbeing-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="wellbeing-modal-header">
              <div className="wellbeing-modal-title">
                <div
                  className="wellbeing-app-icon-wrap large"
                  style={{
                    backgroundColor: `${selectedAppDetail.appInfo.color}20`,
                    color: selectedAppDetail.appInfo.color,
                  }}
                >
                  <selectedAppDetail.appInfo.Icon size={22} />
                </div>
                <div>
                  <h3>{selectedAppDetail.name}</h3>
                  <span className="wellbeing-sub-tag">
                    {selectedAppDetail.appInfo.category.name} • {selectedAppDetail.percent}% of daily screen time
                  </span>
                </div>
              </div>

              <button
                className="wellbeing-modal-close"
                onClick={() => setSelectedAppId(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="wellbeing-modal-body">
              {/* Stat Row */}
              <div className="wellbeing-modal-stats">
                <div className="wellbeing-mini-stat">
                  <span className="label">Total Duration</span>
                  <span className="val">{formatTime(selectedAppDetail.totalSeconds)}</span>
                </div>
                <div className="wellbeing-mini-stat">
                  <span className="label">Recorded Sessions</span>
                  <span className="val">{selectedAppDetail.sessions.length}</span>
                </div>
              </div>

              {/* Hourly Usage Breakdown */}
              <div className="wellbeing-detail-section">
                <h4>Hourly Active Timeline (24 Hours)</h4>
                <div className="wellbeing-hourly-timeline">
                  {selectedAppDetail.hourlyUsage.map((secs, hr) => {
                    const maxHr = Math.max(...selectedAppDetail.hourlyUsage, 60);
                    const pct = Math.min(100, Math.round((secs / maxHr) * 100));
                    const label = hr === 0 ? '12a' : hr === 12 ? '12p' : hr > 12 ? `${hr - 12}p` : `${hr}a`;
                    return (
                      <div key={hr} className="wellbeing-hourly-col" title={`${label}: ${formatTime(secs)}`}>
                        <div className="wellbeing-hourly-bar-track">
                          <div
                            className="wellbeing-hourly-bar-fill"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: selectedAppDetail.appInfo.color,
                            }}
                          />
                        </div>
                        <span className="wellbeing-hourly-label">{hr % 4 === 0 ? label : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sessions List */}
              {selectedAppDetail.sessions.length > 0 && (
                <div className="wellbeing-detail-section">
                  <h4>Recorded Window Sessions</h4>
                  <div className="wellbeing-sessions-list">
                    {selectedAppDetail.sessions.slice(-8).reverse().map((s, idx) => {
                      const startTimeStr = new Date(s.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTimeStr = new Date(s.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div key={idx} className="wellbeing-session-item">
                          <div className="wellbeing-session-info">
                            <span className="title truncate">{s.title || selectedAppDetail.name}</span>
                            <span className="time">{startTimeStr} - {endTimeStr}</span>
                          </div>
                          <span className="duration">{formatTime(s.durationSeconds)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
