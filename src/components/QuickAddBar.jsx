import React, { useState } from 'react';
import { Plus, Sparkles, Calendar, Maximize2 } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

export function QuickAddBar({ onAddTask, onOpenFullModal, isCompactMode = false }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueTarget, setDueTarget] = useState('today'); // 'today' | 'tomorrow'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const todayStr = getLocalDateString();
    let dueDate = todayStr;
    if (dueTarget === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      dueDate = getLocalDateString(tom);
    }

    onAddTask({
      title: title.trim(),
      priority,
      dueDate,
      dueTime: '12:00',
      tags: [],
      category: '',
      subtasks: [],
      attachments: [],
    });

    setTitle('');
  };

  const cyclePriority = () => {
    const cycle = ['low', 'medium', 'high', 'urgent'];
    const nextIdx = (cycle.indexOf(priority) + 1) % cycle.length;
    setPriority(cycle[nextIdx]);
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'urgent':
        return 'var(--badge-urgent-text)';
      case 'high':
        return 'var(--badge-high-text)';
      case 'low':
        return 'var(--badge-low-text)';
      default:
        return 'var(--badge-med-text)';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`quick-add-bar ${isCompactMode ? 'is-compact-bar' : ''}`}>
      <div className="quick-add-input-wrapper">
        <Plus size={13} className="quick-add-icon" />
        <input
          id="quick-add-task-input"
          type="text"
          className="quick-add-input"
          placeholder={isCompactMode ? "Quick add... (Enter)" : "Quick add task... (Press Enter)"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="quick-add-controls">
        {/* Priority quick-cycle */}
        <button
          type="button"
          className={`quick-add-pill-btn ${isCompactMode ? 'icon-only' : ''}`}
          onClick={cyclePriority}
          title={`Priority: ${priority.toUpperCase()} (Click to change)`}
          style={{ color: getPriorityColor() }}
        >
          <Sparkles size={11} />
          {!isCompactMode && <span style={{ textTransform: 'capitalize' }}>{priority}</span>}
        </button>

        {/* Date quick-toggle */}
        <button
          type="button"
          className={`quick-add-pill-btn ${isCompactMode ? 'icon-only' : ''}`}
          onClick={() => setDueTarget(dueTarget === 'today' ? 'tomorrow' : 'today')}
          title={`Due: ${dueTarget === 'today' ? 'Today' : 'Tomorrow'} (Click to toggle)`}
        >
          <Calendar size={11} />
          {!isCompactMode && <span style={{ textTransform: 'capitalize' }}>{dueTarget}</span>}
        </button>

        {/* Expand to Full Modal */}
        <button
          type="button"
          className="quick-add-pill-btn icon-only"
          onClick={onOpenFullModal}
          title="Open full task creator with subtasks & attachments"
        >
          <Maximize2 size={11} />
        </button>
      </div>
    </form>
  );
}
