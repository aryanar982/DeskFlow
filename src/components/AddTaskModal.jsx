import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { getLocalDateString, parseTimeTo12Hour, formatTo24HourTime } from '../utils/dateUtils';

const MINUTE_OPTIONS = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function AddTaskModal({ isOpen, onClose, onSave, initialTask = null }) {
  const [title,   setTitle]   = useState('');
  const [dueDate, setDueDate] = useState('');
  const [hour12,  setHour12]  = useState(12);
  const [minute,  setMinute]  = useState('00');
  const [period,  setPeriod]  = useState('PM');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDueDate(initialTask.dueDate || getLocalDateString());
      const t = parseTimeTo12Hour(initialTask.dueTime || '12:00');
      setHour12(t.hour);
      setMinute(t.minute);
      setPeriod(t.period);
    } else {
      setTitle('');
      setDueDate(getLocalDateString());
      const now = new Date();
      const t = parseTimeTo12Hour(`${String((now.getHours() + 1) % 24).padStart(2, '0')}:00`);
      setHour12(t.hour);
      setMinute('00');
      setPeriod(t.period);
    }
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const dueTime = formatTo24HourTime(hour12, minute, period);
    onSave({
      title:       title.trim(),
      description: initialTask?.description || '',
      priority:    initialTask?.priority || 'medium',
      category:    initialTask?.category?.toLowerCase() === 'general' ? '' : (initialTask?.category || ''),
      tags:        (initialTask?.tags || []).filter((t) => t && t.toLowerCase() !== 'general'),
      dueDate,
      dueTime,
      dueDateTime: dueDate ? `${dueDate}T${dueTime}:00` : '',
      recurrence:  initialTask?.recurrence || 'none',
      color:       initialTask?.color || 'none',
      pinned:      initialTask?.pinned || false,
      subtasks:    initialTask?.subtasks || [],
      attachments: initialTask?.attachments || [],
    });
    onClose();
  };

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="ntm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={initialTask ? 'Edit Task' : 'New Task'}
      >
        {/* Header */}
        <div className="ntm-header">
          <span className="ntm-title">{initialTask ? 'Edit Task' : 'New Task'}</span>
          <button className="ntm-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ntm-form">

          {/* Task Name */}
          <div className="ntm-field">
            <label className="ntm-label">Task Name</label>
            <input
              ref={inputRef}
              type="text"
              className="ntm-input ntm-main-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Due Date */}
          <div className="ntm-field">
            <label className="ntm-label">
              <Calendar size={11} /> Due Date
            </label>
            <input
              type="date"
              className="ntm-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Due Time */}
          <div className="ntm-field">
            <label className="ntm-label">
              <Clock size={11} /> Due Time
            </label>
            <div className="ntm-time-row">
              <select
                className="ntm-input ntm-time-sel"
                value={hour12}
                onChange={(e) => setHour12(Number(e.target.value))}
                aria-label="Hour"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="ntm-colon">:</span>
              <select
                className="ntm-input ntm-time-sel"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                aria-label="Minute"
              >
                {MINUTE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <div className="ntm-ampm">
                <button
                  type="button"
                  className={`ntm-ampm-btn ${period === 'AM' ? 'active' : ''}`}
                  onClick={() => setPeriod('AM')}
                >AM</button>
                <button
                  type="button"
                  className={`ntm-ampm-btn ${period === 'PM' ? 'active' : ''}`}
                  onClick={() => setPeriod('PM')}
                >PM</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="ntm-footer">
            <button type="button" className="ntm-btn ntm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="ntm-btn ntm-btn-submit"
              disabled={!title.trim()}
            >
              {initialTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
