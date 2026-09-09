import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  Check,
} from 'lucide-react';
import {
  getLocalDateString,
  formatTaskDate,
  getDueStatus,
  format12HourTime,
} from '../utils/dateUtils';
import { TaskCard } from './TaskCard';

export function CalendarView({
  tasks = [],
  selectedDate = null,
  onSelectDate,
  onRescheduleTask,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}) {
  // Calendar Views: 'month' | 'week' | 'agenda'
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayStr = getLocalDateString();

  // Navigation handlers
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (onSelectDate) onSelectDate(todayStr);
  };

  // Map tasks to dates for O(1) lookups
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (t.dueDate && !t.archived) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Handle Drag & Drop task rescheduling onto a specific day
  const handleDropOnDate = (e, dateStr) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onRescheduleTask) {
      onRescheduleTask(taskId, dateStr);
    }
  };

  const handleDragOverCell = (e) => {
    e.preventDefault();
  };

  // Map task color to CSS style
  const getTaskColorHex = (task) => {
    switch (task.color) {
      case 'blue':
        return '#0078d4';
      case 'purple':
        return '#8b5cf6';
      case 'emerald':
        return '#10b981';
      case 'amber':
        return '#f59e0b';
      case 'rose':
        return '#f43f5e';
      case 'cyan':
        return '#06b6d4';
      default:
        return task.priority === 'urgent'
          ? '#ef4444'
          : task.priority === 'high'
          ? '#f97316'
          : 'var(--accent-primary)';
    }
  };

  // --- MONTH VIEW DATA ---
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // --- WEEK VIEW DATA ---
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    // Monday as first day of week:
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = getLocalDateString(d);
      days.push({
        date: d,
        dateStr: dStr,
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        dayNum: d.getDate(),
        tasks: tasksByDate[dStr] || [],
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [currentDate, tasksByDate, todayStr]);

  // --- AGENDA VIEW DATA ---
  const agendaDates = useMemo(() => {
    const dates = Object.keys(tasksByDate).sort();
    return dates.map((dateStr) => ({
      dateStr,
      formattedHeader: formatTaskDate(dateStr, null, { includeRelative: true }),
      tasks: tasksByDate[dateStr],
    }));
  }, [tasksByDate]);

  // Filter tasks for selected date
  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate] || [] : [];

  return (
    <div className="calendar-widget">
      {/* Calendar Header with View Switcher */}
      <div className="calendar-top-bar">
        <div className="calendar-title-group">
          <CalendarIcon size={14} style={{ color: 'var(--accent-primary)' }} />
          <span className="calendar-title">
            {viewMode === 'week'
              ? `Week of ${weekDays[0]?.dayName}, ${monthNames[weekDays[0]?.date.getMonth()]} ${weekDays[0]?.dayNum}`
              : `${monthNames[month]} ${year}`}
          </span>
        </div>

        {/* View Switcher Tabs: Month | Week | Agenda */}
        <div className="calendar-view-switcher">
          <button
            type="button"
            className={`calendar-view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
            title="Month View"
          >
            Month
          </button>
          <button
            type="button"
            className={`calendar-view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
            title="Week View"
          >
            Week
          </button>
          <button
            type="button"
            className={`calendar-view-btn ${viewMode === 'agenda' ? 'active' : ''}`}
            onClick={() => setViewMode('agenda')}
            title="Agenda Timeline"
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="calendar-controls-bar">
        <button
          type="button"
          className="calendar-today-pill"
          onClick={goToToday}
          title="Jump to Today"
        >
          Today
        </button>

        {selectedDate && (
          <button
            type="button"
            className="calendar-clear-pill"
            onClick={() => onSelectDate(null)}
            title="Clear date selection"
          >
            <RotateCcw size={10} />
            <span>Clear filter</span>
          </button>
        )}

        <div className="calendar-nav-arrows">
          <button className="calendar-nav-btn" onClick={prevPeriod} title="Previous">
            <ChevronLeft size={13} />
          </button>
          <button className="calendar-nav-btn" onClick={nextPeriod} title="Next">
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: MONTH GRID VIEW
          ======================================================== */}
      {viewMode === 'month' && (
        <div className="calendar-grid-container">
          <div className="calendar-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="calendar-day-header">
                {d}
              </div>
            ))}

            {/* Empty cells before month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day-cell empty" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayTasks = tasksByDate[dateStr] || [];
              const hasOverdue = dayTasks.some(
                (t) => !t.completed && getDueStatus(t.dueDate, t.dueTime, false).isOverdue
              );

              return (
                <div
                  key={dayNum}
                  className={`calendar-day-cell ${isToday ? 'today' : ''} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => onSelectDate(isSelected ? null : dateStr)}
                  onDragOver={handleDragOverCell}
                  onDrop={(e) => handleDropOnDate(e, dateStr)}
                  title={`${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''} on ${formatTaskDate(dateStr, null, { includeRelative: true })}\n(Drag tasks here to reschedule)`}
                >
                  <span className="day-number">{dayNum}</span>

                  {/* Task color dots or chips */}
                  {dayTasks.length > 0 && (
                    <div className="calendar-dots-row">
                      {dayTasks.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="calendar-color-dot"
                          style={{ backgroundColor: getTaskColorHex(t) }}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="calendar-more-count">+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  )}

                  {hasOverdue && (
                    <span className="calendar-overdue-indicator" title="Overdue task on this day" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 2: WEEK COLUMN VIEW
          ======================================================== */}
      {viewMode === 'week' && (
        <div className="calendar-week-container">
          <div className="calendar-week-strip">
            {weekDays.map((wd) => {
              const isSelected = wd.dateStr === selectedDate;
              return (
                <div
                  key={wd.dateStr}
                  className={`week-day-col ${wd.isToday ? 'today' : ''} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => onSelectDate(isSelected ? null : wd.dateStr)}
                  onDragOver={handleDragOverCell}
                  onDrop={(e) => handleDropOnDate(e, wd.dateStr)}
                  title="Drop task here to reschedule"
                >
                  <div className="week-day-header">
                    <span className="week-day-name">{wd.dayName}</span>
                    <span className="week-day-number">{wd.dayNum}</span>
                  </div>

                  <div className="week-day-task-count">
                    {wd.tasks.length} {wd.tasks.length === 1 ? 'task' : 'tasks'}
                  </div>

                  {/* Task Pills */}
                  <div className="week-tasks-list">
                    {wd.tasks.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className={`week-task-pill ${t.completed ? 'done' : ''}`}
                        style={{ borderLeftColor: getTaskColorHex(t) }}
                        title={t.title}
                      >
                        <span className="week-task-title">{t.title}</span>
                        {t.dueTime && (
                          <span className="week-task-time">{format12HourTime(t.dueTime)}</span>
                        )}
                      </div>
                    ))}
                    {wd.tasks.length > 4 && (
                      <div className="week-more-chip">+{wd.tasks.length - 4} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 3: AGENDA TIMELINE VIEW
          ======================================================== */}
      {viewMode === 'agenda' && (
        <div className="calendar-agenda-container">
          {agendaDates.length === 0 ? (
            <div className="empty-agenda-state">
              <CalendarDays size={20} style={{ opacity: 0.4, margin: '0 auto 6px' }} />
              <p>No scheduled tasks found.</p>
              <span>Add due dates to your tasks to view them on the agenda timeline.</span>
            </div>
          ) : (
            <div className="agenda-timeline">
              {agendaDates.map((group) => (
                <div key={group.dateStr} className="agenda-day-group">
                  <div className="agenda-day-header">
                    <span className="agenda-day-title">{group.formattedHeader}</span>
                    <span className="agenda-day-badge">{group.tasks.length}</span>
                  </div>

                  <div className="agenda-tasks-list">
                    {group.tasks.map((t) => (
                      <div
                        key={t.id}
                        className={`agenda-task-item ${t.completed ? 'completed' : ''}`}
                      >
                        <div
                          className={`task-checkbox-custom ${t.completed ? 'checked' : ''}`}
                          onClick={() => onToggleTask && onToggleTask(t.id)}
                          style={{ width: 14, height: 14 }}
                        >
                          {t.completed && <Check size={10} strokeWidth={3} />}
                        </div>

                        <div className="agenda-task-details">
                          <span className="agenda-task-name">{t.title}</span>
                          <div className="agenda-task-submeta">
                            {t.category && (
                              <span className="agenda-cat-tag">#{t.category}</span>
                            )}
                            {t.dueTime && (
                              <span className="agenda-time-tag">
                                <Clock size={9} /> {format12HourTime(t.dueTime)}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className="agenda-color-indicator"
                          style={{ backgroundColor: getTaskColorHex(t) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SELECTED DATE TASKS DRILL-DOWN (Month & Week Views)
          ======================================================== */}
      {viewMode !== 'agenda' && (
        <div className="calendar-drilldown-section">
          <div className="calendar-drilldown-header">
            <span className="calendar-drilldown-title">
              {selectedDate
                ? `Tasks for ${formatTaskDate(selectedDate, null, { includeRelative: true })}`
                : "Today & Upcoming Tasks"}
            </span>
            <span className="calendar-drilldown-count">
              {selectedDateTasks.length} {selectedDateTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="calendar-drilldown-list">
            {selectedDateTasks.length === 0 ? (
              <div className="empty-drilldown-state">
                {selectedDate
                  ? 'No tasks scheduled for this day.'
                  : 'Select a day above or drag tasks onto cells to schedule.'}
              </div>
            ) : (
              selectedDateTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
