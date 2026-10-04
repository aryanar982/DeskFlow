import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { formatHeaderClock } from '../utils/dateUtils';

export function Header({
  userName = '',
  filter,
  setFilter,
  categoryFilter = 'all',
  setCategoryFilter,
  onOpenAddTask,
  stats,
  isCompactMode = false,
}) {
  const [greeting, setGreeting] = useState('');
  const [clock, setClock] = useState(() => formatHeaderClock(new Date()));

  useEffect(() => {
    const updateTimeInfo = () => {
      const now = new Date();
      const hour = now.getHours();
      const trimmed = (userName || '').trim();
      const hasName = Boolean(trimmed);

      if (hour < 12) {
        setGreeting(
          hasName
            ? (isCompactMode ? `Morning, ${trimmed}` : `Good Morning, ${trimmed}`)
            : 'Good Morning'
        );
      } else if (hour < 17) {
        setGreeting(
          hasName
            ? (isCompactMode ? `Afternoon, ${trimmed}` : `Good Afternoon, ${trimmed}`)
            : 'Good Afternoon'
        );
      } else {
        setGreeting(
          hasName
            ? (isCompactMode ? `Evening, ${trimmed}` : `Good Evening, ${trimmed}`)
            : 'Good Evening'
        );
      }

      setClock(formatHeaderClock(now));
    };

    updateTimeInfo();
    const interval = setInterval(updateTimeInfo, 10000);
    return () => clearInterval(interval);
  }, [userName, isCompactMode]);

  const categories = ['all', 'Work', 'Personal', 'Study', 'Health', 'Finance', 'Project', 'Design'];

  return (
    <div className={`app-header ${isCompactMode ? 'is-compact-header' : ''}`}>
      {/* Top Greeting & Header Actions */}
      <div className="header-top">
        <div className="header-greeting-block">
          <div className="header-greeting-row">
            <h1 className="header-greeting-title">{greeting}</h1>
          </div>
          <div className="header-clock-container">
            <span className="header-live-time">{clock.timeText}</span>
            <span className="header-date-badge">{clock.dateText}</span>
          </div>
        </div>

        <div className="header-top-actions">
          {/* New Task Button */}
          <button className="quick-add-btn" onClick={onOpenAddTask} id="btn-add-task" title="New Task (N)">
            <Plus size={13} strokeWidth={2.5} />
            <span>{isCompactMode ? 'Add' : 'New Task'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="filter-chips">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFilter('all');
            if (setCategoryFilter) setCategoryFilter('all');
          }}
        >
          All ({stats.total})
        </button>

        <button
          className={`filter-chip ${filter === 'today' ? 'active' : ''}`}
          onClick={() => {
            setFilter('today');
            if (setCategoryFilter) setCategoryFilter('all');
          }}
        >
          Today ({stats.todayTotal})
        </button>

        <button
          className={`filter-chip ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => {
            setFilter('upcoming');
            if (setCategoryFilter) setCategoryFilter('all');
          }}
        >
          Upcoming ({stats.upcomingTotal})
        </button>

        <button
          className={`filter-chip filter-chip-completed filter-chip-done ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => {
            setFilter('completed');
            if (setCategoryFilter) setCategoryFilter('all');
          }}
        >
          Completed ({stats.completed})
        </button>
      </div>
    </div>
  );
}
