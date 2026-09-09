import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Sunset,
  Target,
  Sparkles,
  Quote,
  CheckCircle2,
  Calendar,
  RotateCw,
  Award,
  Flame,
  ArrowRight,
  ListTodo,
  Smile,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';
import { aiService } from '../services/aiService';

const QUOTES_LIBRARY = [
  {
    quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
  },
  {
    quote: "It is not that we have a short time to live, but that we waste a lot of it.",
    author: "Seneca",
  },
  {
    quote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    author: "James Clear",
  },
  {
    quote: "Focus is a matter of deciding what things you're not going to do.",
    author: "John Carmack",
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  {
    quote: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.",
    author: "Leo Babauta",
  },
  {
    quote: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
  },
];

const PLANNER_STORAGE_KEY = 'deskflow_daily_planner_v2';

export function DailyPlanner({
  tasks = [],
  onToggleTask,
  onBatchUpdateTasks,
  stats,
}) {
  const [plannerMode, setPlannerMode] = useState('morning'); // 'morning' | 'evening' | 'schedule'
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES_LIBRARY.length));

  // Persistent planner state
  const [plannerData, setPlannerData] = useState(() => {
    try {
      const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            date: getLocalDateString(),
            topThreeTaskIds: [],
            dailyTargetGoal: 4,
            reflectionNote: '',
          };
    } catch {
      return {
        date: getLocalDateString(),
        topThreeTaskIds: [],
        dailyTargetGoal: 4,
        reflectionNote: '',
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerData));
    } catch (err) {
      console.error('Failed to save planner data', err);
    }
  }, [plannerData]);

  const todayStr = getLocalDateString();
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && !t.archived);
  }, [tasks, todayStr]);

  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const pendingTodayTasks = todayTasks.filter((t) => !t.completed);

  // Top 3 tasks
  const topThreeTasks = useMemo(() => {
    return (plannerData.topThreeTaskIds || [])
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean);
  }, [plannerData.topThreeTaskIds, tasks]);

  const toggleTopTask = (id) => {
    setPlannerData((prev) => {
      const current = prev.topThreeTaskIds || [];
      if (current.includes(id)) {
        return { ...prev, topThreeTaskIds: current.filter((i) => i !== id) };
      }
      if (current.length >= 3) {
        return { ...prev, topThreeTaskIds: [current[1], current[2], id] };
      }
      return { ...prev, topThreeTaskIds: [...current, id] };
    });
  };

  // Rollover unfinished tasks to tomorrow
  const handleRolloverTasks = () => {
    if (pendingTodayTasks.length === 0) return;
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const tomStr = getLocalDateString(tom);

    if (onBatchUpdateTasks) {
      onBatchUpdateTasks(
        pendingTodayTasks.map((t) => t.id),
        { dueDate: tomStr }
      );
    }
  };

  // Next random quote
  const handleShuffleQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES_LIBRARY.length);
  };

  // AI Generated Daily Schedule
  const aiSchedule = useMemo(() => {
    return aiService.generateSchedule(todayTasks.length > 0 ? todayTasks : tasks);
  }, [todayTasks, tasks]);

  // Daily goal progress
  const targetGoal = plannerData.dailyTargetGoal || 4;
  const goalProgress = Math.min(100, Math.round((completedTodayTasks.length / targetGoal) * 100));

  const currentQuote = QUOTES_LIBRARY[quoteIndex];

  return (
    <div className="daily-planner-container animate-fade-in">
      {/* Daily Quote Card */}
      <div className="daily-quote-card">
        <div className="quote-header">
          <div className="quote-badge">
            <Quote size={11} />
            <span>Daily Wisdom</span>
          </div>
          <button
            className="quote-shuffle-btn"
            onClick={handleShuffleQuote}
            title="Shuffle quote"
          >
            <RotateCw size={11} />
          </button>
        </div>
        <p className="quote-text">"{currentQuote.quote}"</p>
        <span className="quote-author">— {currentQuote.author}</span>
      </div>

      {/* Daily Goal Target Bar */}
      <div className="daily-goal-card">
        <div className="daily-goal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={13} style={{ color: 'var(--accent-primary)' }} />
            <span className="daily-goal-title">Daily Execution Target</span>
          </div>
          <span className="daily-goal-fraction">
            {completedTodayTasks.length} / {targetGoal} tasks
          </span>
        </div>

        <div className="daily-goal-bar-track">
          <div
            className="daily-goal-bar-fill"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <div className="daily-goal-footer">
          <span>{goalProgress}% accomplished today</span>
          <div className="goal-target-stepper">
            <button
              onClick={() =>
                setPlannerData((p) => ({
                  ...p,
                  dailyTargetGoal: Math.max(1, (p.dailyTargetGoal || 4) - 1),
                }))
              }
              title="Decrease goal target"
            >
              -
            </button>
            <span>Target: {targetGoal}</span>
            <button
              onClick={() =>
                setPlannerData((p) => ({
                  ...p,
                  dailyTargetGoal: (p.dailyTargetGoal || 4) + 1,
                }))
              }
              title="Increase goal target"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher: Morning Planner | Evening Review | AI Schedule */}
      <div className="planner-sub-tabs">
        <button
          type="button"
          className={`planner-sub-tab ${plannerMode === 'morning' ? 'active' : ''}`}
          onClick={() => setPlannerMode('morning')}
        >
          <Sun size={12} />
          <span>Morning Plan</span>
        </button>

        <button
          type="button"
          className={`planner-sub-tab ${plannerMode === 'evening' ? 'active' : ''}`}
          onClick={() => setPlannerMode('evening')}
        >
          <Sunset size={12} />
          <span>Evening Review</span>
        </button>

        <button
          type="button"
          className={`planner-sub-tab ${plannerMode === 'schedule' ? 'active' : ''}`}
          onClick={() => setPlannerMode('schedule')}
        >
          <Sparkles size={12} />
          <span>AI Schedule</span>
        </button>
      </div>

      {/* ========================================================
          1. MORNING PLANNER
          ======================================================== */}
      {plannerMode === 'morning' && (
        <div className="planner-section-card animate-fade-in">
          <div className="planner-section-title">
            <Sun size={13} style={{ color: '#f59e0b' }} />
            <span>Top 3 Must-Win Priorities for Today</span>
          </div>
          <p className="planner-section-desc">
            Narrow your focus down to 3 crucial achievements that will make today a victory.
          </p>

          {/* Top 3 Selected List */}
          <div className="top-three-list">
            {[0, 1, 2].map((idx) => {
              const task = topThreeTasks[idx];
              return (
                <div
                  key={idx}
                  className={`top-three-slot ${task ? 'filled' : 'empty'}`}
                >
                  <span className="slot-number">#{idx + 1}</span>
                  {task ? (
                    <div className="slot-task-info">
                      <span
                        className={`slot-task-title ${task.completed ? 'done' : ''}`}
                        onClick={() => onToggleTask && onToggleTask(task.id)}
                      >
                        {task.title}
                      </span>
                      <button
                        className="slot-remove-btn"
                        onClick={() => toggleTopTask(task.id)}
                        title="Remove from Top 3"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="slot-placeholder">Select a priority from below</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Available Tasks Picker */}
          <div className="planner-picker-title">Pick from Today's Tasks:</div>
          <div className="planner-tasks-picker">
            {todayTasks.length === 0 ? (
              <div className="empty-planner-tasks">No tasks scheduled for today.</div>
            ) : (
              todayTasks.map((t) => {
                const isSelected = (plannerData.topThreeTaskIds || []).includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`planner-task-choice ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTopTask(t.id)}
                  >
                    <span className="choice-check">{isSelected ? '★' : '+'}</span>
                    <span className="choice-title">{t.title}</span>
                    <span className="choice-priority">{t.priority}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. EVENING REVIEW
          ======================================================== */}
      {plannerMode === 'evening' && (
        <div className="planner-section-card animate-fade-in">
          <div className="planner-section-title">
            <Sunset size={13} style={{ color: '#f97316' }} />
            <span>Evening Reflection & Rollover</span>
          </div>

          {/* Day Recap Badges */}
          <div className="evening-recap-grid">
            <div className="recap-box">
              <span className="recap-val" style={{ color: '#10b981' }}>
                {completedTodayTasks.length}
              </span>
              <span className="recap-lbl">Completed</span>
            </div>
            <div className="recap-box">
              <span className="recap-val" style={{ color: '#f59e0b' }}>
                {pendingTodayTasks.length}
              </span>
              <span className="recap-lbl">Remaining</span>
            </div>
            <div className="recap-box">
              <span className="recap-val" style={{ color: 'var(--accent-primary)' }}>
                {todayTasks.length === 0
                  ? '0%'
                  : `${Math.round((completedTodayTasks.length / todayTasks.length) * 100)}%`}
              </span>
              <span className="recap-lbl">Win Rate</span>
            </div>
          </div>

          {/* Reflection Notepad */}
          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Smile size={11} /> What went well today? What can I improve tomorrow?
            </label>
            <textarea
              className="form-input form-textarea"
              rows={2}
              placeholder="Capture key wins, blockers, or ideas for tomorrow..."
              value={plannerData.reflectionNote || ''}
              onChange={(e) =>
                setPlannerData((p) => ({ ...p, reflectionNote: e.target.value }))
              }
            />
          </div>

          {/* Rollover Unfinished Tasks Button */}
          {pendingTodayTasks.length > 0 && (
            <div className="rollover-action-box">
              <div className="rollover-text">
                <strong>{pendingTodayTasks.length} unfinished tasks</strong> remaining from today.
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 6 }}
                onClick={handleRolloverTasks}
              >
                <ArrowRight size={13} />
                <span>Rollover Unfinished Tasks to Tomorrow</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          3. AI SCHEDULE TIMELINE
          ======================================================== */}
      {plannerMode === 'schedule' && (
        <div className="planner-section-card animate-fade-in">
          <div className="planner-section-title">
            <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Structured Daily Timeline</span>
          </div>
          <p className="planner-section-desc">{aiSchedule.summary}</p>

          <div className="ai-slots-container">
            {/* Morning */}
            <div className="ai-slot-box">
              <div className="ai-slot-title">
                <Sun size={11} style={{ color: '#f59e0b' }} />
                <span>Morning (Peak Focus)</span>
              </div>
              {aiSchedule.morning.length === 0 ? (
                <div className="slot-empty-note">No morning items assigned</div>
              ) : (
                aiSchedule.morning.map((t) => (
                  <div key={t.id} className="ai-schedule-row">
                    <span className="schedule-dot">•</span>
                    <span className="schedule-task-title">{t.title}</span>
                    <button
                      className="schedule-done-btn"
                      onClick={() => onToggleTask && onToggleTask(t.id)}
                    >
                      <CheckCircle2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Afternoon */}
            <div className="ai-slot-box">
              <div className="ai-slot-title">
                <Sunset size={11} style={{ color: '#f97316' }} />
                <span>Afternoon (Execution)</span>
              </div>
              {aiSchedule.afternoon.length === 0 ? (
                <div className="slot-empty-note">No afternoon items assigned</div>
              ) : (
                aiSchedule.afternoon.map((t) => (
                  <div key={t.id} className="ai-schedule-row">
                    <span className="schedule-dot">•</span>
                    <span className="schedule-task-title">{t.title}</span>
                    <button
                      className="schedule-done-btn"
                      onClick={() => onToggleTask && onToggleTask(t.id)}
                    >
                      <CheckCircle2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Evening */}
            <div className="ai-slot-box">
              <div className="ai-slot-title">
                <Sun size={11} style={{ color: '#8b5cf6' }} />
                <span>Evening (Review & Wind-down)</span>
              </div>
              {aiSchedule.evening.length === 0 ? (
                <div className="slot-empty-note">No evening items assigned</div>
              ) : (
                aiSchedule.evening.map((t) => (
                  <div key={t.id} className="ai-schedule-row">
                    <span className="schedule-dot">•</span>
                    <span className="schedule-task-title">{t.title}</span>
                    <button
                      className="schedule-done-btn"
                      onClick={() => onToggleTask && onToggleTask(t.id)}
                    >
                      <CheckCircle2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
