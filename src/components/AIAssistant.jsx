import React, { useState, useMemo } from 'react';
import { Sparkles, Sun, Sunset, Moon, Lightbulb, RefreshCw, CheckCircle2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { format12HourTime } from '../utils/dateUtils';

export function AIAssistant({ tasks, onToggleTask }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const schedule = useMemo(() => {
    return aiService.generateSchedule(tasks);
  }, [tasks, refreshKey]);

  const renderTaskItem = (t) => (
    <div
      key={t.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11.5,
        padding: '3px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span
          style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={t.title}
        >
          • {t.title}
        </span>
        {t.dueTime && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-family-mono)',
              flexShrink: 0,
            }}
          >
            {format12HourTime(t.dueTime)}
          </span>
        )}
      </div>
      <button
        onClick={() => onToggleTask(t.id)}
        style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
        title="Mark Done"
      >
        <CheckCircle2 size={12} />
      </button>
    </div>
  );

  return (
    <div className="ai-planner-card">
      <div className="ai-planner-header">
        <div className="ai-tag">
          <Sparkles size={14} />
          <span>AI Daily Schedule Planner</span>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          style={{ color: 'var(--text-secondary)', padding: 4, borderRadius: 4 }}
          title="Regenerate Plan"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
        {schedule.summary}
      </div>

      {/* Morning Slot */}
      <div className="ai-slot-box">
        <div className="ai-slot-title">
          <Sun size={12} style={{ color: '#f59e0b' }} />
          <span>Morning (Deep Focus & High Priority)</span>
        </div>
        {schedule.morning.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No morning tasks assigned
          </div>
        ) : (
          schedule.morning.map(renderTaskItem)
        )}
      </div>

      {/* Afternoon Slot */}
      <div className="ai-slot-box">
        <div className="ai-slot-title">
          <Sunset size={12} style={{ color: '#f97316' }} />
          <span>Afternoon (Execution & Collaborations)</span>
        </div>
        {schedule.afternoon.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No afternoon tasks assigned
          </div>
        ) : (
          schedule.afternoon.map(renderTaskItem)
        )}
      </div>

      {/* Evening Slot */}
      <div className="ai-slot-box">
        <div className="ai-slot-title">
          <Moon size={12} style={{ color: '#8b5cf6' }} />
          <span>Evening (Review & Low Intensity)</span>
        </div>
        {schedule.evening.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
            No evening tasks assigned
          </div>
        ) : (
          schedule.evening.map(renderTaskItem)
        )}
      </div>

      {/* AI Smart Tip */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <Lightbulb size={13} style={{ color: '#eab308', flexShrink: 0, marginTop: 1 }} />
        <span>{schedule.tip}</span>
      </div>
    </div>
  );
}
