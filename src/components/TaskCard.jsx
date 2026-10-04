import React from 'react';
import {
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  isBulkMode = false,
  isSelected = false,
  onToggleSelect,
  draggable = true,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver = false,
  isCompactMode = false,
}) {
  return (
    <div
      className={`task-card animate-fade-in ${task.completed ? 'completed' : ''} ${
        isDragOver ? 'is-drag-over' : ''
      } ${isCompactMode ? 'is-compact-card' : ''}`}
      draggable={draggable && !isBulkMode}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, task.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop && onDrop(e, task.id)}
    >
      {/* Checkbox */}
      {isBulkMode ? (
        <input
          type="checkbox"
          className="bulk-select-checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(task.id)}
          aria-label={`Select ${task.title}`}
        />
      ) : (
        <div
          className={`task-checkbox-custom ${task.completed ? 'checked' : ''} ${
            isCompactMode ? 'compact-checkbox' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          role="checkbox"
          aria-checked={task.completed}
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {task.completed && <Check size={isCompactMode ? 10 : 12} strokeWidth={3} />}
        </div>
      )}

      {/* Task Name */}
      <div className="task-details">
        <span
          className="task-title"
          title={task.title}
          onClick={() => onToggle(task.id)}
        >
          {task.title}
        </span>
      </div>

      {/* Action Buttons: Only Edit and Delete */}
      {!isBulkMode && (
        <div className="task-actions">
          {onEdit && (
            <button
              type="button"
              className="task-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              title="Edit Task"
            >
              <Edit2 size={13} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className="task-action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}


