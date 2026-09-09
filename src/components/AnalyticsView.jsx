import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Flame,
  Award,
  Calendar,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Download,
  Zap,
  Target,
  ArrowUpRight,
  Layers,
  ChevronRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  calculateStreaks,
  calculateInsights,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  generateMarkdownReport,
  generateSampleAnalyticsData,
} from '../utils/analyticsEngine';
import { storage } from '../services/storage';

export function AnalyticsView({ tasks = [] }) {
  const [activePeriod, setActivePeriod] = useState('weekly'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [focusHistory, setFocusHistory] = useState(() => storage.getFocusHistory());
  const [useDemoData, setUseDemoData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Sync focus history from storage on mount
  useEffect(() => {
    setFocusHistory(storage.getFocusHistory());
  }, []);

  // Demo Data Generator
  const demoData = useMemo(() => {
    return generateSampleAnalyticsData();
  }, []);

  // Combine or toggle demo data
  const { effectiveTasks, effectiveFocus } = useMemo(() => {
    if (useDemoData) {
      return {
        effectiveTasks: [...tasks, ...demoData.sampleTasks],
        effectiveFocus: [...focusHistory, ...demoData.sampleFocus],
      };
    }
    return {
      effectiveTasks: tasks,
      effectiveFocus: focusHistory,
    };
  }, [useDemoData, tasks, focusHistory, demoData]);

  // Compute Streaks and Activity Heatmap
  const streaks = useMemo(() => {
    return calculateStreaks(effectiveTasks, effectiveFocus);
  }, [effectiveTasks, effectiveFocus]);

  // Compute Actionable Insights
  const insights = useMemo(() => {
    return calculateInsights(effectiveTasks, effectiveFocus);
  }, [effectiveTasks, effectiveFocus]);

  // Compute Period-specific Report Data
  const reportData = useMemo(() => {
    switch (activePeriod) {
      case 'daily':
        return getDailyReport(effectiveTasks, effectiveFocus);
      case 'monthly':
        return getMonthlyReport(effectiveTasks, effectiveFocus);
      case 'yearly':
        return getYearlyReport(effectiveTasks, effectiveFocus);
      case 'weekly':
      default:
        return getWeeklyReport(effectiveTasks, effectiveFocus);
    }
  }, [activePeriod, effectiveTasks, effectiveFocus]);

  // Export Markdown Report
  const handleCopyReport = () => {
    const md = generateMarkdownReport(activePeriod, reportData, insights, streaks);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(md).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      });
    }
  };

  const handleDownloadReport = () => {
    const md = generateMarkdownReport(activePeriod, reportData, insights, streaks);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DeskFlow-Productivity-Report-${activePeriod}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Extract Summary KPIs based on active period
  const kpiCompleted =
    reportData.totalCompleted !== undefined
      ? reportData.totalCompleted
      : reportData.completedCount || 0;

  const kpiFocusHours =
    reportData.totalFocusHours !== undefined
      ? reportData.totalFocusHours
      : reportData.focusHours || '0.0';

  const kpiDelta = reportData.deltaPercent;

  return (
    <div className="analytics-view-wrapper">
      {/* Top Header & Period Selector */}
      <div className="analytics-top-bar">
        <div className="analytics-header-title-block">
          <div className="analytics-badge-title">
            <BarChart3 size={15} className="analytics-icon-pulse" />
            <span>Productivity & Insights</span>
          </div>
          <p className="analytics-subtitle">
            Habit tracking, deep work velocity, and time allocation patterns.
          </p>
        </div>

        <div className="analytics-actions-row">
          {/* Demo Data Toggle */}
          <button
            className={`analytics-btn-pill ${useDemoData ? 'active' : ''}`}
            onClick={() => setUseDemoData(!useDemoData)}
            title={useDemoData ? 'Revert to my real data' : 'Preview with 30-day simulated activity'}
          >
            <Sparkles size={12} />
            <span>{useDemoData ? 'Demo Active' : 'Sample Data'}</span>
          </button>

          {/* Export Report */}
          <div className="analytics-export-group">
            <button
              className="analytics-btn-pill"
              onClick={handleCopyReport}
              title="Copy Markdown Summary"
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Export MD'}</span>
            </button>
            <button
              className="analytics-btn-icon"
              onClick={handleDownloadReport}
              title="Download Report as .md file"
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className="analytics-period-pills">
        <button
          className={`period-pill-tab ${activePeriod === 'daily' ? 'active' : ''}`}
          onClick={() => setActivePeriod('daily')}
        >
          Daily Summary
        </button>
        <button
          className={`period-pill-tab ${activePeriod === 'weekly' ? 'active' : ''}`}
          onClick={() => setActivePeriod('weekly')}
        >
          Weekly Report
        </button>
        <button
          className={`period-pill-tab ${activePeriod === 'monthly' ? 'active' : ''}`}
          onClick={() => setActivePeriod('monthly')}
        >
          Monthly Report
        </button>
        <button
          className={`period-pill-tab ${activePeriod === 'yearly' ? 'active' : ''}`}
          onClick={() => setActivePeriod('yearly')}
        >
          Yearly Momentum
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="analytics-kpi-grid">
        {/* Card 1: Completed Tasks */}
        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
            <CheckCircle2 size={16} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed Tasks</span>
            <div className="kpi-value-row">
              <span className="kpi-main-number">{kpiCompleted}</span>
              {kpiDelta !== undefined && (
                <span className={`kpi-badge-delta ${kpiDelta >= 0 ? 'positive' : 'negative'}`}>
                  {kpiDelta >= 0 ? '+' : ''}{kpiDelta}%
                </span>
              )}
            </div>
            <span className="kpi-subtext">
              {activePeriod === 'daily'
                ? 'Tasks closed today'
                : activePeriod === 'weekly'
                ? `Avg ${(reportData.dailyAverage || 0)} tasks/day`
                : `${reportData.totalCreated || 0} created`}
            </span>
          </div>
        </div>

        {/* Card 2: Focus Hours */}
        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
            <Clock size={16} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Focus Time</span>
            <div className="kpi-value-row">
              <span className="kpi-main-number">{kpiFocusHours}</span>
              <span className="kpi-unit">hrs</span>
            </div>
            <span className="kpi-subtext">
              {reportData.focusMinutes ? `${reportData.focusMinutes} mins logged` : 'Deep work sessions'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Streak */}
        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
            <Flame size={16} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Current Streak</span>
            <div className="kpi-value-row">
              <span className="kpi-main-number">{streaks.currentStreak}</span>
              <span className="kpi-unit">days 🔥</span>
            </div>
            <span className="kpi-subtext">
              Best record: <strong>{streaks.longestStreak} days</strong> 🏆
            </span>
          </div>
        </div>

        {/* Card 4: On-Time & Completion Rate */}
        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Target size={16} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">On-Time Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-main-number">{insights.onTimeRate}%</span>
            </div>
            <span className="kpi-subtext">
              {insights.overallRate}% overall completion
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="analytics-card-section">
        <div className="analytics-section-header">
          <div className="section-title-left">
            <BarChart3 size={14} className="accent-icon" />
            <span className="section-title-text">
              {activePeriod === 'daily'
                ? "Today's Task Completion by Hour"
                : activePeriod === 'weekly'
                ? 'Task Velocity (Past 7 Days)'
                : activePeriod === 'monthly'
                ? '4-Week Task Progression'
                : 'Annual Momentum (12 Months)'}
            </span>
          </div>
          <span className="section-header-tag">
            {activePeriod.toUpperCase()}
          </span>
        </div>

        {/* SVG Chart Container */}
        <div className="chart-canvas-container">
          {renderMainChart({
            activePeriod,
            reportData,
            hoveredDataPoint,
            setHoveredDataPoint,
          })}
        </div>

        {/* Focus Time Velocity Sub-Chart */}
        {renderFocusTimeStrip(activePeriod, reportData)}
      </div>

      {/* 70-Day (10 Weeks) Activity Heatmap (GitHub / Linear Style) */}
      <div className="analytics-card-section">
        <div className="analytics-section-header">
          <div className="section-title-left">
            <CalendarDays size={14} className="accent-icon" />
            <span className="section-title-text">Activity Heatmap (10-Week Consistency)</span>
          </div>
          <div className="heatmap-legend">
            <span className="legend-label">Less</span>
            <span className="legend-cell level-0" />
            <span className="legend-cell level-1" />
            <span className="legend-cell level-2" />
            <span className="legend-cell level-3" />
            <span className="legend-cell level-4" />
            <span className="legend-label">More</span>
          </div>
        </div>

        <div className="heatmap-matrix-container">
          {renderHeatmap(streaks.heatmap, hoveredCell, setHoveredCell)}
        </div>

        {hoveredCell && (
          <div className="heatmap-cell-tooltip">
            <strong>{hoveredCell.date}</strong> ({hoveredCell.dayName}):{' '}
            {hoveredCell.tasksCount} tasks completed, {hoveredCell.focusMinutes}m focus logged
          </div>
        )}
      </div>

      {/* Actionable Insights Grid */}
      <div className="analytics-insights-grid">
        {/* Insight 1: Best Working Hours */}
        <div className="insight-card">
          <div className="insight-card-header">
            <div className="insight-icon-tag" style={{ color: '#0078d4' }}>
              <Clock size={13} />
            </div>
            <span className="insight-title">Best Working Hours</span>
          </div>
          <div className="insight-highlight-value">
            {insights.bestHourWindow}
          </div>
          <p className="insight-desc">
            Most tasks and focus sprints are completed during this window. Protect this block for deep, distraction-free work.
          </p>

          {/* Mini 24-hour hour distribution strip */}
          <div className="hour-distribution-strip">
            {insights.hourlyDistribution.map((cnt, h) => {
              const maxH = Math.max(...insights.hourlyDistribution, 1);
              const heightPct = Math.max(12, Math.round((cnt / maxH) * 100));
              return (
                <div
                  key={h}
                  className={`hour-bar-tick ${cnt > 0 ? 'active' : ''}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${h}:00 – ${cnt} activities`}
                />
              );
            })}
          </div>
          <div className="hour-strip-labels">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </div>

        {/* Insight 2: Most Productive Day */}
        <div className="insight-card">
          <div className="insight-card-header">
            <div className="insight-icon-tag" style={{ color: '#8b5cf6' }}>
              <Zap size={13} />
            </div>
            <span className="insight-title">Most Productive Day</span>
          </div>
          <div className="insight-highlight-value">
            {insights.bestDayName}
          </div>
          <p className="insight-desc">
            Consistently peaks in task throughput. Great day to schedule reviews or major milestones.
          </p>

          {/* Mini 7-day day distribution */}
          <div className="day-distribution-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dName, idx) => {
              const count = insights.dayDistribution[idx] || 0;
              const maxD = Math.max(...insights.dayDistribution, 1);
              const fillPct = Math.max(10, Math.round((count / maxD) * 100));
              const isBest = dName === insights.bestDayName.slice(0, 3);
              return (
                <div key={dName} className={`day-col-item ${isBest ? 'best' : ''}`}>
                  <div className="day-col-bar-wrap">
                    <div
                      className="day-col-bar-fill"
                      style={{ height: `${fillPct}%` }}
                    />
                  </div>
                  <span className="day-col-label">{dName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight 3: Deadline Adherence */}
        <div className="insight-card">
          <div className="insight-card-header">
            <div className="insight-icon-tag" style={{ color: '#10b981' }}>
              <Target size={13} />
            </div>
            <span className="insight-title">Deadline Punctuality</span>
          </div>
          <div className="deadline-stat-row">
            <div className="deadline-rate-circle">
              <span className="rate-number">{insights.onTimeRate}%</span>
              <span className="rate-sub">On-Time</span>
            </div>
            <div className="deadline-breakdown-list">
              <div className="breakdown-line">
                <span className="pill-dot" style={{ background: '#10b981' }} />
                <span>On-time:</span>
                <strong>{insights.onTimeCompleted}</strong>
              </div>
              <div className="breakdown-line">
                <span className="pill-dot" style={{ background: '#f59e0b' }} />
                <span>Late:</span>
                <strong>{insights.lateCompleted}</strong>
              </div>
              <div className="breakdown-line">
                <span className="pill-dot" style={{ background: '#ef4444' }} />
                <span>Overdue:</span>
                <strong className={insights.pendingOverdue > 0 ? 'text-danger' : ''}>
                  {insights.pendingOverdue}
                </strong>
              </div>
            </div>
          </div>
          {insights.pendingOverdue > 0 ? (
            <div className="insight-warning-badge">
              <AlertCircle size={12} />
              <span>{insights.pendingOverdue} task(s) currently overdue. Reschedule or tackle soon.</span>
            </div>
          ) : (
            <p className="insight-desc" style={{ marginTop: 8 }}>
              Zero overdue items! All scheduled commitments remain on track.
            </p>
          )}
        </div>

        {/* Insight 4: Category & Priority Breakdown */}
        <div className="insight-card">
          <div className="insight-card-header">
            <div className="insight-icon-tag" style={{ color: '#ec4899' }}>
              <Layers size={13} />
            </div>
            <span className="insight-title">Category Velocity</span>
          </div>
          <div className="category-bars-list">
            {Object.keys(insights.categoryStats).length === 0 ? (
              <span className="empty-subtext">No categories assigned yet.</span>
            ) : (
              Object.entries(insights.categoryStats).slice(0, 4).map(([catName, data]) => {
                const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                return (
                  <div key={catName} className="category-stat-row">
                    <div className="cat-header-row">
                      <span className="cat-name">{catName}</span>
                      <span className="cat-count">
                        {data.completed}/{data.total} ({pct}%)
                      </span>
                    </div>
                    <div className="cat-progress-track">
                      <div className="cat-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Smart Recommendations Banner */}
      {insights.tips && insights.tips.length > 0 && (
        <div className="analytics-tips-banner">
          <div className="tips-banner-header">
            <Sparkles size={14} className="accent-icon" />
            <span>Productivity Coach Recommendations</span>
          </div>
          <div className="tips-list">
            {insights.tips.map((tip, idx) => (
              <div key={idx} className="tip-item">
                <ChevronRight size={13} className="tip-arrow" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Chart Renderer Helpers
// ----------------------------------------------------------------------

function renderMainChart({ activePeriod, reportData, hoveredDataPoint, setHoveredDataPoint }) {
  if (activePeriod === 'daily') {
    // 24 Hour Task Completion Bar Chart
    const hours = reportData.hourlyCompletion || Array(24).fill(0);
    const maxVal = Math.max(...hours, 3);
    const width = 360;
    const height = 130;
    const padding = { top: 15, bottom: 25, left: 10, right: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barW = chartW / 24;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-svg-chart"
        preserveAspectRatio="none"
      >
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartH * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - ratio)}
            stroke="var(--border-subtle)"
            strokeDasharray="2,2"
            strokeWidth="1"
          />
        ))}

        {/* Hourly Bars */}
        {hours.map((val, h) => {
          const barHeight = val > 0 ? (val / maxVal) * chartH : 3;
          const x = padding.left + h * barW + 2;
          const y = padding.top + (chartH - barHeight);
          const isHovered = hoveredDataPoint === `h-${h}`;

          return (
            <g
              key={h}
              onMouseEnter={() => setHoveredDataPoint(`h-${h}`)}
              onMouseLeave={() => setHoveredDataPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={Math.max(2, barW - 4)}
                height={barHeight}
                rx={2}
                fill={
                  isHovered
                    ? '#38bdf8'
                    : val > 0
                    ? 'var(--accent-primary)'
                    : 'var(--border-subtle)'
                }
                opacity={val > 0 ? 0.9 : 0.35}
                className="chart-bar-anim"
              />
              {/* Tooltip text when hovered */}
              {isHovered && (
                <text
                  x={x + barW / 2}
                  y={Math.max(12, y - 5)}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {val} tasks ({h}:00)
                </text>
              )}
            </g>
          );
        })}

        {/* Hour Axis Labels */}
        <text x={padding.left + 5} y={height - 6} fill="var(--text-tertiary)" fontSize="8.5">
          12 AM
        </text>
        <text x={width / 2} y={height - 6} textAnchor="middle" fill="var(--text-tertiary)" fontSize="8.5">
          12 PM
        </text>
        <text x={width - padding.right - 5} y={height - 6} textAnchor="end" fill="var(--text-tertiary)" fontSize="8.5">
          11 PM
        </text>
      </svg>
    );
  }

  if (activePeriod === 'weekly') {
    // 7-day Dual Column Chart (Completed vs Created)
    const days = reportData.days || [];
    const maxVal = Math.max(...days.map((d) => Math.max(d.completed, d.created)), 4);
    const width = 360;
    const height = 135;
    const padding = { top: 18, bottom: 25, left: 15, right: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const stepW = chartW / 7;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-svg-chart"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartH * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - ratio)}
            stroke="var(--border-subtle)"
            strokeDasharray="2,2"
            strokeWidth="1"
          />
        ))}

        {days.map((day, idx) => {
          const compHeight = day.completed > 0 ? (day.completed / maxVal) * chartH : 4;
          const creHeight = day.created > 0 ? (day.created / maxVal) * chartH : 4;

          const cx = padding.left + idx * stepW + stepW / 2;
          const barWidth = 9;

          const xComp = cx - barWidth - 1;
          const yComp = padding.top + (chartH - compHeight);

          const xCre = cx + 1;
          const yCre = padding.top + (chartH - creHeight);

          const isHovered = hoveredDataPoint === `day-${idx}`;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredDataPoint(`day-${idx}`)}
              onMouseLeave={() => setHoveredDataPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Completed Bar */}
              <rect
                x={xComp}
                y={yComp}
                width={barWidth}
                height={compHeight}
                rx={2.5}
                fill="var(--accent-primary)"
                opacity={day.completed > 0 ? 0.95 : 0.3}
              />
              {/* Created Bar */}
              <rect
                x={xCre}
                y={yCre}
                width={barWidth}
                height={creHeight}
                rx={2.5}
                fill="#818cf8"
                opacity={day.created > 0 ? 0.75 : 0.25}
              />

              {/* Day Label */}
              <text
                x={cx}
                y={height - 7}
                textAnchor="middle"
                fill={isHovered ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                fontSize="9"
                fontWeight={isHovered ? '700' : '500'}
              >
                {day.dayName}
              </text>

              {/* Hover Value Badge */}
              {isHovered && (
                <text
                  x={cx}
                  y={Math.max(12, Math.min(yComp, yCre) - 4)}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="9"
                  fontWeight="bold"
                >
                  ✓{day.completed} | +{day.created}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  if (activePeriod === 'monthly') {
    // 4-Week Column Progression
    const weeks = reportData.weeks || [];
    const maxVal = Math.max(...weeks.map((w) => w.completed), 4);
    const width = 360;
    const height = 135;
    const padding = { top: 18, bottom: 25, left: 20, right: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const stepW = chartW / 4;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="analytics-svg-chart"
        preserveAspectRatio="none"
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + chartH * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - ratio)}
            stroke="var(--border-subtle)"
            strokeDasharray="2,2"
            strokeWidth="1"
          />
        ))}

        {weeks.map((week, idx) => {
          const compHeight = week.completed > 0 ? (week.completed / maxVal) * chartH : 6;
          const cx = padding.left + idx * stepW + stepW / 2;
          const barWidth = 26;
          const x = cx - barWidth / 2;
          const y = padding.top + (chartH - compHeight);
          const isHovered = hoveredDataPoint === `week-${idx}`;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredDataPoint(`week-${idx}`)}
              onMouseLeave={() => setHoveredDataPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={compHeight}
                rx={3.5}
                fill={isHovered ? '#38bdf8' : 'var(--accent-primary)'}
                opacity={week.completed > 0 ? 0.9 : 0.3}
              />
              <text
                x={cx}
                y={height - 7}
                textAnchor="middle"
                fill={isHovered ? 'var(--accent-primary)' : 'var(--text-secondary)'}
                fontSize="9.5"
                fontWeight="600"
              >
                {week.label}
              </text>
              {isHovered && (
                <text
                  x={cx}
                  y={Math.max(12, y - 5)}
                  textAnchor="middle"
                  fill="var(--text-primary)"
                  fontSize="9.5"
                  fontWeight="bold"
                >
                  {week.completed} tasks ({Math.round(week.focusMinutes / 60)}h)
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // Yearly (12 Months)
  const months = reportData.months || [];
  const maxVal = Math.max(...months.map((m) => m.completed), 4);
  const width = 360;
  const height = 135;
  const padding = { top: 18, bottom: 25, left: 10, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const stepW = chartW / 12;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="analytics-svg-chart"
      preserveAspectRatio="none"
    >
      {[0, 0.5, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          y1={padding.top + chartH * (1 - ratio)}
          x2={width - padding.right}
          y2={padding.top + chartH * (1 - ratio)}
          stroke="var(--border-subtle)"
          strokeDasharray="2,2"
          strokeWidth="1"
        />
      ))}

      {months.map((m, idx) => {
        const compHeight = m.completed > 0 ? (m.completed / maxVal) * chartH : 4;
        const cx = padding.left + idx * stepW + stepW / 2;
        const barWidth = Math.max(5, stepW - 6);
        const x = cx - barWidth / 2;
        const y = padding.top + (chartH - compHeight);
        const isHovered = hoveredDataPoint === `month-${idx}`;

        return (
          <g
            key={idx}
            onMouseEnter={() => setHoveredDataPoint(`month-${idx}`)}
            onMouseLeave={() => setHoveredDataPoint(null)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={compHeight}
              rx={2}
              fill={isHovered ? '#38bdf8' : 'var(--accent-primary)'}
              opacity={m.completed > 0 ? 0.9 : 0.3}
            />
            <text
              x={cx}
              y={height - 7}
              textAnchor="middle"
              fill={isHovered ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
              fontSize="8"
              fontWeight="500"
            >
              {m.label[0]}
            </text>
            {isHovered && (
              <text
                x={cx}
                y={Math.max(12, y - 5)}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="8.5"
                fontWeight="bold"
              >
                {m.label}: {m.completed}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Focus Time Strip
function renderFocusTimeStrip(activePeriod, reportData) {
  let label = 'Focus Duration';
  let valText = `${reportData.totalFocusHours || reportData.focusHours || '0.0'} Hours`;

  return (
    <div className="focus-strip-container">
      <div className="focus-strip-info">
        <Clock size={12} className="accent-icon" />
        <span className="focus-strip-label">{label}:</span>
        <strong className="focus-strip-val">{valText}</strong>
      </div>
      <div className="focus-strip-bar">
        <div
          className="focus-strip-fill"
          style={{
            width: `${Math.min(100, Math.max(15, parseFloat(reportData.totalFocusHours || reportData.focusHours || 0) * 8))}%`,
          }}
        />
      </div>
    </div>
  );
}

// 70-Day Heatmap Grid Renderer
function renderHeatmap(heatmapData = [], hoveredCell, setHoveredCell) {
  // Organize 70 cells into 10 columns of 7 days (Sun=0 to Sat=6)
  const columns = [];
  for (let c = 0; c < 10; c++) {
    columns.push(heatmapData.slice(c * 7, (c + 1) * 7));
  }

  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="heatmap-layout-wrapper">
      <div className="heatmap-day-labels">
        {dayLetters.map((letter, i) => (
          <span key={i} className="heatmap-row-label">
            {i % 2 === 1 ? letter : ''}
          </span>
        ))}
      </div>
      <div className="heatmap-columns-grid">
        {columns.map((week, colIdx) => (
          <div key={colIdx} className="heatmap-week-column">
            {week.map((cell, rowIdx) => (
              <div
                key={cell.date || rowIdx}
                className={`heatmap-cell-square level-${cell.intensity}`}
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
