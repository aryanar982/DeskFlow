import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export function WelcomeNameModal({ isOpen, currentName = '', onSave, onSkip }) {
  const [name, setName] = useState(currentName || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 80);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onSave(name.trim());
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '360px',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-card)',
          background: 'var(--bg-modal)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 20px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 2,
            }}
          >
            <Sparkles size={22} />
          </div>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Welcome to DeskFlow
          </h2>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            What should we call you? Your name will be used in your personal greeting.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '0 20px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field">
            <input
              ref={inputRef}
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name (e.g. Rahul)"
              maxLength={40}
              style={{
                fontSize: 14,
                padding: '10px 12px',
                textAlign: 'center',
                fontWeight: 600,
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              You can change or remove this anytime in Settings.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSkip}
              style={{ flex: 1, padding: '9px 12px', fontSize: 12 }}
            >
              Skip
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.4, padding: '9px 12px', fontSize: 12, gap: 6 }}
            >
              <span>Get Started</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
