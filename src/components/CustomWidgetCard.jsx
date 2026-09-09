import React, { useState } from 'react';
import { Sparkles, Edit3, Check, Clock, Quote, StickyNote } from 'lucide-react';

export function CustomWidgetCard({ config, onUpdateConfig }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(config?.title || 'Daily Focus Mantra');
  const [content, setContent] = useState(
    config?.content || 'Flow with intention. Deep work produces rare value.'
  );

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateConfig) {
      onUpdateConfig({
        ...config,
        title: title.trim() || 'Custom Widget',
        content: content.trim() || '',
      });
    }
  };

  const getIcon = () => {
    switch (config?.type) {
      case 'countdown':
        return <Clock size={13} style={{ color: 'var(--accent-primary)' }} />;
      case 'note':
        return <StickyNote size={13} style={{ color: 'var(--accent-primary)' }} />;
      case 'quote':
      default:
        return <Quote size={13} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <div
      className="custom-widget-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        marginBottom: '10px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        transition: 'all var(--transition-fast)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {getIcon()}
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                padding: '2px 6px',
                height: 24,
                background: 'var(--bg-input)',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                letterSpacing: '0.2px',
                textTransform: 'uppercase',
              }}
            >
              {config?.title || 'Daily Focus Mantra'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          title={isEditing ? 'Save Changes' : 'Edit Widget'}
          style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-tertiary)',
            background: isEditing ? 'var(--accent-soft)' : 'transparent',
          }}
        >
          {isEditing ? (
            <Check size={12} style={{ color: 'var(--accent-primary)' }} />
          ) : (
            <Edit3 size={12} />
          )}
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="form-input"
          style={{
            width: '100%',
            fontSize: 12,
            padding: '6px 8px',
            resize: 'none',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
          }}
        />
      ) : (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.45,
            color: 'var(--text-primary)',
            fontStyle: config?.type === 'quote' ? 'italic' : 'normal',
            margin: 0,
            wordBreak: 'break-word',
          }}
        >
          {config?.content || 'Flow with intention. Deep work produces rare value.'}
        </p>
      )}
    </div>
  );
}
