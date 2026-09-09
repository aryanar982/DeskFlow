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
  FileText,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Plus,
  ExternalLink,
  Briefcase,
  User,
  BookOpen,
  HeartPulse,
  DollarSign,
  Layers,
} from 'lucide-react';
import { getDueStatus } from '../utils/dateUtils';
import { launcher } from '../services/launcher';

// Map category to icon
function getCategoryIcon(category) {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'work':
      return <Briefcase size={10} />;
    case 'personal':
      return <User size={10} />;
    case 'study':
      return <BookOpen size={10} />;
    case 'health':
      return <HeartPulse size={10} />;
    case 'finance':
      return <DollarSign size={10} />;
    default:
      return <Layers size={10} />;
  }
}

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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

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

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const visibleTags = (task.tags || []).filter(
    (tag) => tag && tag.toLowerCase() !== 'general'
  );
  const hasCategory = Boolean(
    task.category && task.category.toLowerCase() !== 'general'
  );

  const handleAddSubtaskSubmit = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    if (onAddSubtask) {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
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

            {/* Row 2: Glance Meta (Category, External Key, Subtask count) */}
            {(hasCategory || task.externalSource || subtasks.length > 0 || visibleTags.length > 0 || task.description) && (
              <div className="task-glance-row2">
                {hasCategory && (
                  <span className="task-cat-mini" title={`Category: ${task.category}`}>
                    {getCategoryIcon(task.category)}
                    <span>{task.category}</span>
                  </span>
                )}

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

                {subtasks.length > 0 && (
                  <button
                    type="button"
                    className="task-subtask-mini"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={`${completedSubtasks}/${subtasks.length} subtasks`}
                  >
                    <span>{completedSubtasks}/{subtasks.length} subtasks</span>
                    {isExpanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  </button>
                )}

                {visibleTags.length > 0 && (
                  <span
                    className="task-tag mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectTag) onSelectTag(visibleTags[0]);
                    }}
                    title={`Tag: #${visibleTags[0]}`}
                  >
                    #{visibleTags[0]}
                  </span>
                )}

                {task.description && (
                  <button
                    type="button"
                    className="task-note-toggle-btn mini"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="View notes"
                  >
                    <FileText size={9} />
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

              {/* Golden Pin Badge */}
              {task.pinned && (
                <span className="task-pin-badge" title="Pinned to top">
                  <Pin size={10} />
                </span>
              )}

              {/* Recurrence Badge */}
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

            {/* Task Metadata Chips (Category, Priority, Tags, Due Date) */}
            <div className="task-meta">
              {/* Category Chip */}
              {hasCategory && (
                <span className="task-category-chip" title={`Category: ${task.category}`}>
                  {getCategoryIcon(task.category)}
                  <span>{task.category}</span>
                </span>
              )}

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

              {/* Multi-Tags */}
              {visibleTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="task-tag"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  title={`Filter by tag #${tag}`}
                >
                  #{tag}
                </span>
              ))}

              {/* Due Date Status */}
              {task.dueDate && (
                <span
                  className={`task-due ${dueStatus.isOverdue ? 'overdue' : ''}`}
                  title={dueStatus.fullFormatted ? `Due: ${dueStatus.fullFormatted}` : undefined}
                >
                  {dueStatus.isOverdue ? (
                    <AlertCircle size={11} className="task-clock-icon" />
                  ) : (
                    <Clock size={11} className="task-clock-icon" />
                  )}
                  <span>{dueStatus.statusText}</span>
                </span>
              )}

              {/* Subtasks Progress Chip (Toggle Expansion) */}
              {subtasks.length > 0 && (
                <button
                  type="button"
                  className={`task-subtasks-chip ${subtaskProgress === 100 ? 'all-done' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={`${completedSubtasks}/${subtasks.length} subtasks completed (${subtaskProgress}%)`}
                >
                  <span className="subtasks-count">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                  <div className="subtasks-mini-bar">
                    <div
                      className="subtasks-mini-fill"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                  {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              )}

              {/* Notes Indicator */}
              {task.description && (
                <button
                  type="button"
                  className="task-note-toggle-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title="View task notes"
                >
                  <FileText size={11} />
                </button>
              )}

              {/* Attachments Count Indicator */}
              {(task.attachments || []).length > 0 && (
                <span className="task-attachment-chip" title={`${task.attachments.length} attachment(s)`}>
                  <Paperclip size={10} />
                  <span>{task.attachments.length}</span>
                </span>
              )}
            </div>
          </>
        )}

        {/* Expandable Section: Notes, Subtasks, Attachments */}
        {isExpanded && (
          <div className="task-expanded-drawer animate-fade-in">
            {/* Notes Section */}
            {task.description && (
              <div className="task-drawer-notes">
                <div className="task-drawer-label">
                  <FileText size={10} /> Notes
                </div>
                <div className="task-drawer-notes-content">{task.description}</div>
              </div>
            )}

            {/* Subtasks Checklist */}
            <div className="task-drawer-subtasks">
              <div className="task-drawer-label">
                <span>Checklist ({completedSubtasks}/{subtasks.length})</span>
                <span className="task-drawer-percent">{subtaskProgress}%</span>
              </div>

              <div className="subtasks-checklist">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className={`subtask-item ${st.completed ? 'done' : ''}`}
                  >
                    <div
                      className={`subtask-checkbox ${st.completed ? 'checked' : ''}`}
                      onClick={() => onToggleSubtask && onToggleSubtask(task.id, st.id)}
                    >
                      {st.completed && <Check size={10} strokeWidth={3} />}
                    </div>
                    <span
                      className="subtask-text"
                      onClick={() => onToggleSubtask && onToggleSubtask(task.id, st.id)}
                    >
                      {st.title}
                    </span>
                    <button
                      className="subtask-delete-btn"
                      onClick={() => onDeleteSubtask && onDeleteSubtask(task.id, st.id)}
                      title="Delete subtask"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick Add Subtask Input */}
              <form onSubmit={handleAddSubtaskSubmit} className="subtask-add-row">
                <input
                  type="text"
                  className="subtask-add-input"
                  placeholder="+ Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                />
                <button
                  type="submit"
                  className="subtask-add-btn"
                  disabled={!newSubtaskTitle.trim()}
                  title="Add subtask"
                >
                  <Plus size={11} />
                </button>
              </form>
            </div>

            {/* Attachments Section */}
            {(task.attachments || []).length > 0 && (
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
            )}
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
