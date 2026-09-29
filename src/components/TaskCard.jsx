import React, { useState } from 'react';
import {
  Check,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  GripVertical,
  Pin,
  Repeat,
  Copy,
  Archive,
  RotateCcw,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { getDueStatus } from '../utils/dateUtils';
import { launcher } from '../services/launcher';

export function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
  onPin,
  onArchive,
  onDuplicate,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onSelectTag,
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
  const [isExpanded, setIsExpanded] = useState(false);

  const dueStatus = getDueStatus(task.dueDate, task.dueTime, task.completed);

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-medium';
    }
  };

  const handleOpenAttachment = (e, att) => {
    e.stopPropagation();
    launcher.open({ type: att.type, target: att.path });
  };

  return (
    <div
      className={`task-card animate-fade-in ${task.completed ? 'completed' : ''} ${
        dueStatus.isOverdue ? 'is-overdue' : ''
      } ${task.color && task.color !== 'none' ? `task-color-${task.color}` : ''} ${
        task.pinned ? 'is-pinned' : ''
      } ${isSelected ? 'is-selected' : ''} ${isDragOver ? 'is-drag-over' : ''} ${
        isCompactMode ? 'is-compact-card' : ''
      }`}
      draggable={draggable && !isBulkMode}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, task.id)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop && onDrop(e, task.id)}
    >
      {/* Drag Grip Handle */}
      {!isBulkMode && draggable && (
        <div className="task-drag-handle" title="Drag to reorder">
          <GripVertical size={isCompactMode ? 11 : 13} />
        </div>
      )}

      {/* Bulk Selection Checkbox OR Task Completion Checkbox */}
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
          onClick={() => onToggle(task.id)}
          role="checkbox"
          aria-checked={task.completed}
          title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {task.completed && <Check size={isCompactMode ? 10 : 12} strokeWidth={3} />}
        </div>
      )}

      {/* Main Task Content */}
      <div className="task-details">
        {/* COMPACT GLANCE LAYOUT (360-420px) */}
        {isCompactMode ? (
          <div className="task-glance-body">
            <div className="task-glance-row1">
              {/* Priority pip */}
              <span
                className={`task-priority-pip ${getPriorityClass(task.priority)}`}
                title={`Priority: ${task.priority || 'medium'}`}
              />

              {/* Title */}
              <span
                className="task-title"
                title={task.title}
                onClick={() => onToggle(task.id)}
              >
                {task.title}
              </span>

              {/* Pinned star/pin */}
              {task.pinned && (
                <span className="task-pin-badge" title="Pinned to top">
                  <Pin size={9} />
                </span>
              )}

              {/* Due status right pill */}
              {task.dueDate && (
                <span
                  className={`task-glance-due ${dueStatus.isOverdue ? 'overdue' : ''}`}
                  title={dueStatus.fullFormatted || `Due: ${task.dueDate}`}
                >
                  {dueStatus.statusText}
                </span>
              )}
            </div>

            {/* Row 2: Glance Meta (External Key, Attachments) */}
            {(task.externalSource || (task.attachments || []).length > 0) && (
              <div className="task-glance-row2">
                {task.externalSource && (
                  <span
                    className="task-external-badge mini"
                    style={{
                      color: task.externalSource.color || 'var(--text-primary)',
                      borderColor: `${task.externalSource.color || '#24292e'}40`,
                      background: `${task.externalSource.color || '#24292e'}18`,
                    }}
                    title={`Imported from ${task.externalSource.providerName}`}
                  >
                    {task.externalSource.key}
                  </span>
                )}

                {(task.attachments || []).length > 0 && (
                  <button
                    type="button"
                    className="task-note-toggle-btn mini"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="View attachments"
                  >
                    <Paperclip size={9} />
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* LARGE / FULL MODE DETAILED LAYOUT */
          <>
            <div className="task-title-row">
              <span
                className="task-title"
                title={task.title}
                onClick={() => onToggle(task.id)}
              >
                {task.title}
              </span>

              {(task.pinned || (task.recurrence && task.recurrence !== 'none')) && (
                <div className="task-title-badges">
                  {task.pinned && (
                    <span className="task-pin-badge" title="Pinned to top">
                      <Pin size={10} />
                    </span>
                  )}
                  {task.recurrence && task.recurrence !== 'none' && (
                    <span
                      className="task-recurrence-badge"
                      title={`Repeats: ${task.recurrence}`}
                    >
                      <Repeat size={10} />
                      <span>{task.recurrence}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Task Metadata Chips (External Key, Priority, Due Date, Attachments) */}
            <div className="task-meta">
              {/* External Integration Source Badge */}
              {task.externalSource && (
                <span
                  className="task-external-badge"
                  style={{
                    background: `${task.externalSource.color || '#24292e'}20`,
                    color: task.externalSource.color || 'var(--text-primary)',
                    borderColor: `${task.externalSource.color || '#24292e'}40`,
                  }}
                  title={`Imported from ${task.externalSource.providerName || 'External'}`}
                >
                  {task.externalSource.badge} {task.externalSource.key}
                </span>
              )}

              {/* Priority Badge */}
              <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                {task.priority || 'medium'}
              </span>

              {/* Due Date Status */}
              {task.dueDate && (
                <span
                  className={`task-due ${dueStatus.isOverdue ? 'overdue' : ''}`}
                  title={dueStatus.fullFormatted ? `Due: ${dueStatus.fullFormatted}` : undefined}
                >
                  <Clock size={11} className="task-clock-icon" />
                  <span>{dueStatus.statusText}</span>
                </span>
              )}

              {/* Subtasks Progress Chip (Toggle Expansion) */}
              {/* Attachments Count Indicator */}
              {(task.attachments || []).length > 0 && (
                <button
                  type="button"
                  className="task-attachment-chip"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={`${task.attachments.length} attachment(s)`}
                >
                  <Paperclip size={10} />
                  <span>{task.attachments.length}</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Expandable Section: Attachments */}
        {isExpanded && (task.attachments || []).length > 0 && (
          <div className="task-expanded-drawer animate-fade-in">
            {/* Attachments Section */}
            <div className="task-drawer-attachments">
              <div className="task-drawer-label">
                <Paperclip size={10} /> Attachments
              </div>
              <div className="attachments-list">
                {task.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    className="attachment-pill"
                    onClick={(e) => handleOpenAttachment(e, att)}
                    title={`Open ${att.name}`}
                  >
                    <ExternalLink size={10} />
                    <span className="attachment-name">{att.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isBulkMode && (
        <div className="task-actions">
          {/* Pin Toggle */}
          {onPin && (
            <button
              className={`task-action-btn ${task.pinned ? 'pinned active' : ''}`}
              onClick={() => onPin(task.id)}
              title={task.pinned ? 'Unpin Task' : 'Pin to Top'}
            >
              <Pin size={12} />
            </button>
          )}

          {/* Edit */}
          {onEdit && (
            <button
              className="task-action-btn"
              onClick={() => onEdit(task)}
              title="Edit Task"
            >
              <Edit2 size={12} />
            </button>
          )}

          {/* Duplicate */}
          {onDuplicate && (
            <button
              className="task-action-btn"
              onClick={() => onDuplicate(task.id)}
              title="Duplicate Task"
            >
              <Copy size={12} />
            </button>
          )}

          {/* Archive / Restore */}
          {onArchive && (
            <button
              className="task-action-btn"
              onClick={() => onArchive(task.id)}
              title={task.archived ? 'Restore Task' : 'Archive Task'}
            >
              {task.archived ? <RotateCcw size={12} /> : <Archive size={12} />}
            </button>
          )}

          {/* Delete */}
          <button
            className="task-action-btn delete"
            onClick={() => onDelete(task.id)}
            title="Delete Task"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
