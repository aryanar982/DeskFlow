import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', desc: 'Quick add task (or open task modal)' },
    { key: '/', desc: 'Focus smart search omnibox' },
    { key: 'Esc', desc: 'Close modals / clear selection / clear search' },
    { key: 'Ctrl + Enter', desc: 'Submit and save task' },
    { key: 'B', desc: 'Toggle bulk selection mode' },
    { key: 'A', desc: 'Select / deselect all tasks (in bulk mode)' },
    { key: 'Delete', desc: 'Delete selected tasks (in bulk mode)' },
    { key: 'Alt + M', desc: 'Toggle Compact Mini-Bar / Full Mode' },
    { key: '?', desc: 'Toggle keyboard shortcuts cheatsheet' },
  ];

  const searchTips = [
    { prefix: '#tag', desc: 'Filter tasks by tag (e.g. #design, #dev)' },
    { prefix: '@category', desc: 'Filter by category (e.g. @work, @personal)' },
    { prefix: '!urgent', desc: 'Filter by priority (!urgent, !high, !low)' },
    { prefix: 'due:today', desc: 'Filter tasks due today or due:tomorrow' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog modal-shortcuts animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={16} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="modal-title">Keyboard Shortcuts & Smart Search</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="shortcuts-content">
          <div className="shortcuts-section-title">Productivity Hotkeys</div>
          <div className="shortcuts-grid">
            {shortcuts.map((sc, i) => (
              <div key={i} className="shortcut-row">
                <span className="shortcut-desc">{sc.desc}</span>
                <kbd className="shortcut-kbd">{sc.key}</kbd>
              </div>
            ))}
          </div>

          <div className="shortcuts-section-title" style={{ marginTop: 14 }}>
            Smart Search Syntax
          </div>
          <div className="shortcuts-grid">
            {searchTips.map((tip, i) => (
              <div key={i} className="shortcut-row">
                <span className="shortcut-desc">{tip.desc}</span>
                <code className="shortcut-code">{tip.prefix}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
