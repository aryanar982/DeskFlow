import React, { useState, useEffect } from 'react';
import { StickyNote, Copy, Check, Trash } from 'lucide-react';
import { storage } from '../services/storage';

export function StickyNotes() {
  const [note, setNote] = useState(() => storage.getNote());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    storage.setNote(note);
  }, [note]);

  const handleCopy = () => {
    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    if (window.confirm('Clear sticky note?')) {
      setNote('');
    }
  };

  return (
    <div className="sticky-note-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#eab308' }}>
          <StickyNote size={14} />
          <span>Desktop Scratchpad</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{ padding: 4, borderRadius: 4, color: 'var(--text-tertiary)' }}
          >
            {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
          </button>
          <button
            onClick={handleClear}
            title="Clear note"
            style={{ padding: 4, borderRadius: 4, color: 'var(--text-tertiary)' }}
          >
            <Trash size={12} />
          </button>
        </div>
      </div>

      <textarea
        className="sticky-note-textarea"
        placeholder="Type quick ideas, clipboard dumps, or temporary notes here..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="sticky-note-footer">
        <span>Autosaved locally</span>
        <span>{note.length} characters</span>
      </div>
    </div>
  );
}
