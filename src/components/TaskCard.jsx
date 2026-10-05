import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Edit2,
  Trash2,
} from 'lucide-react';

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onUpdate,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      if (onUpdate) onUpdate(task.id, { title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`task-card animate-fade-in ${task.completed ? 'completed' : ''} ${
        isDragOver ? 'is-drag-over' : ''
      } ${isCompactMode ? 'is-compact-card' : ''}`}
      draggable={draggable && !isBulkMode && !isEditing}
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
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              outline: 'none',
              fontSize: '15px',
            }}
          />
        ) : (
          <span
            className="task-title"
            title={task.title}
            onClick={() => onToggle(task.id)}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Action Buttons: Only Edit and Delete */}
      {!isBulkMode && (
        <div className="task-actions">
          {onUpdate && !isEditing && (
            <button
              type="button"
              className="task-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
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


