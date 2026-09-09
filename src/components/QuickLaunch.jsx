import React, { useState } from 'react';
import {
  Globe,
  Code,
  Folder,
  FileText,
  GitBranch,
  Bot,
  Plus,
  X,
  ExternalLink,
  Laptop,
  GripHorizontal,
} from 'lucide-react';
import { launcher } from '../services/launcher';

const ICON_MAP = {
  Globe,
  Code,
  Folder,
  FileText,
  GitBranch,
  Bot,
  Laptop,
  ExternalLink,
};

export function QuickLaunch({
  shortcuts = [],
  onAddShortcut,
  onDeleteShortcut,
  onReorderShortcuts,
  onAppLaunch,
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState('url'); // 'url' | 'app'

  // Drag and drop reordering state
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleLaunch = (item) => {
    launcher.open(item);
    if (onAppLaunch) {
      onAppLaunch(item.label, item.target);
    }
  };

  const handleBrowseFile = async () => {
    const selected = await launcher.selectFile();
    if (selected) {
      setTarget(selected);
      setType('app');
      const name = selected.split(/[\\/]/).pop().replace(/\.[^/.]+$/, '');
      if (!label && name) setLabel(name);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!label.trim() || !target.trim()) return;

    onAddShortcut({
      id: 'sc-' + Date.now(),
      label: label.trim(),
      target: target.trim(),
      type,
      icon: type === 'url' ? 'Globe' : 'Laptop',
    });

    setLabel('');
    setTarget('');
    setIsAddOpen(false);
  };

  // Drag and drop reordering handlers
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/shortcut-id', id);
    setDraggedId(id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/shortcut-id') || draggedId;

    if (sourceId && sourceId !== targetId && onReorderShortcuts) {
      const cloned = [...shortcuts];
      const sourceIdx = cloned.findIndex((s) => s.id === sourceId);
      const destIdx = cloned.findIndex((s) => s.id === targetId);

      if (sourceIdx !== -1 && destIdx !== -1) {
        const [removed] = cloned.splice(sourceIdx, 1);
        cloned.splice(destIdx, 0, removed);
        onReorderShortcuts(cloned);
      }
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  // Support dragging external file from Explorer or web link onto the grid
  const handleGridDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const filePath = file.path || file.name;
      const fileName = file.name.replace(/\.[^/.]+$/, '');

      onAddShortcut({
        id: 'sc-' + Date.now(),
        label: fileName || 'File Shortcut',
        target: filePath,
        type: 'app',
        icon: 'Folder',
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          Quick Access
        </span>
        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            fontSize: 11,
            color: 'var(--accent-primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add Shortcut
        </button>
      </div>

      {/* Shortcuts Grid with Drag & Drop */}
      <div
        className="quick-launch-grid"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleGridDrop}
        title="Drag shortcuts to reorder, or drop files here to add"
      >
        {shortcuts.map((sc) => {
          const IconComponent = ICON_MAP[sc.icon] || ExternalLink;
          const isDragOver = dragOverId === sc.id;

          return (
            <div
              key={sc.id}
              className={`quick-launch-card ${isDragOver ? 'is-drag-over' : ''}`}
              onClick={() => handleLaunch(sc)}
              draggable
              onDragStart={(e) => handleDragStart(e, sc.id)}
              onDragOver={(e) => handleDragOver(e, sc.id)}
              onDrop={(e) => handleDrop(e, sc.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              title={`Launch ${sc.label}\n(Drag to reorder)`}
            >
              <button
                className="quick-launch-del"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteShortcut(sc.id);
                }}
                title="Remove Shortcut"
              >
                <X size={10} />
              </button>

              <div className="quick-launch-icon-wrapper">
                <IconComponent size={18} />
              </div>
              <span className="quick-launch-label">{sc.label}</span>
            </div>
          );
        })}
      </div>

      {/* Add Shortcut Dialog */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Quick Shortcut</h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Shortcut Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    className={`btn ${type === 'url' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setType('url')}
                  >
                    Website URL
                  </button>
                  <button
                    type="button"
                    className={`btn ${type === 'app' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setType('app')}
                  >
                    App / File
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Name / Label</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Spotify, Figma, Jira"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {type === 'url' ? 'Web Address (URL)' : 'Path / Command'}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder={type === 'url' ? 'https://example.com' : 'calc, notepad, or C:\\...'}
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    required
                  />
                  {type === 'app' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleBrowseFile}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Browse...
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
