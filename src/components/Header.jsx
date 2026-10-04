import React from 'react';
import { Plus } from 'lucide-react';

export function Header({
  onOpenAddTask,
  isCompactMode = false,
}) {
  return (
    <div className={`app-header ${isCompactMode ? 'is-compact-header' : ''}`}>
      <div className="header-actions-row">
        <button
          className="quick-add-btn"
          onClick={onOpenAddTask}
          id="btn-add-task"
          title="Add Task (N)"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
}

