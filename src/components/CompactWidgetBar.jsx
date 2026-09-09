import React from 'react';
import {
  GripVertical,
  Check,
  Cpu,
  HardDrive,
  Play,
  Pause,
  Maximize2,
  Clock,
  Pin,
} from 'lucide-react';
import { formatHeaderClock } from '../utils/dateUtils';

export function CompactWidgetBar({
  nextTask,
  onToggleTask,
  onExpandToFull,
  systemStats,
  alwaysOnTop,
  onTogglePin,
}) {
  const clock = formatHeaderClock(new Date());

  return (
    <div className="compact-widget-bar animate-fade-in">
      {/* Drag Grip Handle */}
      <div className="compact-drag-handle" title="Drag Compact Widget">
        <GripVertical size={13} />
      </div>

      {/* Mini Clock */}
      <div className="compact-clock-section">
        <span className="compact-time">{clock.timeText}</span>
        <span className="compact-date">{clock.dateText.split(',')[0]}</span>
      </div>

      <div className="compact-divider" />

      {/* Next Task Item */}
      <div className="compact-task-section">
        {nextTask ? (
          <div className="compact-task-row">
            <div
              className={`task-checkbox-custom ${nextTask.completed ? 'checked' : ''}`}
              onClick={() => onToggleTask && onToggleTask(nextTask.id)}
              style={{ width: 14, height: 14 }}
              title="Complete next task"
            >
              {nextTask.completed && <Check size={10} strokeWidth={3} />}
            </div>
            <span className="compact-task-title" title={nextTask.title}>
              {nextTask.title}
            </span>
          </div>
        ) : (
          <span className="compact-no-task">All caught up! 🎉</span>
        )}
      </div>

      <div className="compact-divider" />

      {/* Hardware meters */}
      <div className="compact-meters-section">
        <div className="compact-meter" title={`CPU Usage: ${systemStats.cpuPercent}%`}>
          <Cpu size={11} style={{ color: 'var(--accent-primary)' }} />
          <span>{systemStats.cpuPercent}%</span>
        </div>
        <div className="compact-meter" title={`RAM Usage: ${systemStats.memPercent}%`}>
          <HardDrive size={11} style={{ color: '#8b5cf6' }} />
          <span>{systemStats.memPercent}%</span>
        </div>
      </div>

      <div className="compact-divider" />

      {/* Pin & Expand Controls */}
      <div className="compact-controls">
        <button
          type="button"
          className={`compact-ctrl-btn ${alwaysOnTop ? 'active' : ''}`}
          onClick={onTogglePin}
          title={alwaysOnTop ? 'Unpin' : 'Always on top'}
        >
          <Pin size={11} />
        </button>

        <button
          type="button"
          className="compact-ctrl-btn expand"
          onClick={onExpandToFull}
          title="Expand to Full Widget"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}
