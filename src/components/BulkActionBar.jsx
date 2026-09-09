import React from 'react';
import {
  Check,
  Calendar,
  Sparkles,
  Archive,
  Trash2,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

export function BulkActionBar({
  selectedIds = [],
  allIds = [],
  onToggleSelectAll,
  onCompleteSelected,
  onDeleteSelected,
  onArchiveSelected,
  onSetPrioritySelected,
  onSetDueDateSelected,
  onClearSelection,
}) {
  if (selectedIds.length === 0) return null;

  const count = selectedIds.length;
  const isAllSelected = count === allIds.length && allIds.length > 0;

  const handleSetToday = () => {
    onSetDueDateSelected(selectedIds, getLocalDateString());
  };

  const handleSetTomorrow = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    onSetDueDateSelected(selectedIds, getLocalDateString(tom));
  };

  return (
    <div className="bulk-action-bar animate-slide-up">
      <div className="bulk-action-left">
        <button
          type="button"
          className="bulk-select-all-btn"
          onClick={onToggleSelectAll}
          title={isAllSelected ? 'Deselect all' : 'Select all'}
        >
          {isAllSelected ? <CheckSquare size={13} /> : <Square size={13} />}
        </button>
        <span className="bulk-count-badge">
          {count} {count === 1 ? 'task' : 'tasks'} selected
        </span>
      </div>

      <div className="bulk-action-buttons">
        {/* Complete */}
        <button
          type="button"
          className="bulk-btn primary"
          onClick={() => onCompleteSelected(selectedIds, true)}
          title="Mark selected completed"
        >
          <Check size={12} strokeWidth={2.5} />
          <span>Complete</span>
        </button>

        {/* Due Date: Today */}
        <button
          type="button"
          className="bulk-btn"
          onClick={handleSetToday}
          title="Set due date to Today"
        >
          <Calendar size={11} />
          <span>Today</span>
        </button>

        {/* Due Date: Tomorrow */}
        <button
          type="button"
          className="bulk-btn"
          onClick={handleSetTomorrow}
          title="Set due date to Tomorrow"
        >
          <Calendar size={11} />
          <span>Tmrw</span>
        </button>

        {/* Priority: Urgent */}
        <button
          type="button"
          className="bulk-btn"
          onClick={() => onSetPrioritySelected(selectedIds, 'urgent')}
          title="Set priority to Urgent"
        >
          <Sparkles size={11} />
          <span>Urgent</span>
        </button>

        {/* Archive */}
        <button
          type="button"
          className="bulk-btn"
          onClick={() => onArchiveSelected(selectedIds, true)}
          title="Archive selected tasks"
        >
          <Archive size={11} />
          <span>Archive</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          className="bulk-btn danger"
          onClick={() => onDeleteSelected(selectedIds)}
          title="Delete selected tasks"
        >
          <Trash2 size={11} />
        </button>

        {/* Clear selection */}
        <button
          type="button"
          className="bulk-btn close"
          onClick={onClearSelection}
          title="Dismiss selection"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
