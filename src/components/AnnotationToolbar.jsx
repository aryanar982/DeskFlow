import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Highlighter,
  Eraser,
  RotateCcw,
  RotateCw,
  Trash2,
  Palette,
  Check,
  Hand,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';
import {
  ANNOTATION_COLORS,
  PEN_SIZES,
  HIGHLIGHTER_SIZES,
  ERASER_SIZES,
  OPACITY_OPTIONS,
} from '../utils/annotationUtils';

export function AnnotationToolbar({
  activeTool,
  setActiveTool,
  color,
  setColor,
  penSize,
  setPenSize,
  highlighterSize = 24,
  setHighlighterSize,
  eraserSize,
  setEraserSize,
  opacity = 0.4,
  setOpacity,
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onClearAll,
  strokeCount = 0,
  zoom = 1,
  setZoom,
  pan = { x: 0, y: 0 },
  setPan,
}) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);

  const colorMenuRef = useRef(null);
  const sizeMenuRef = useRef(null);
  const opacityMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (colorMenuRef.current && !colorMenuRef.current.contains(e.target)) {
        setShowColorMenu(false);
      }
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target)) {
        setShowSizeMenu(false);
      }
      if (opacityMenuRef.current && !opacityMenuRef.current.contains(e.target)) {
        setShowOpacityMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSizes =
    activeTool === 'eraser'
      ? ERASER_SIZES
      : activeTool === 'highlighter'
      ? HIGHLIGHTER_SIZES
      : PEN_SIZES;

  const currentSizeVal =
    activeTool === 'eraser'
      ? eraserSize
      : activeTool === 'highlighter'
      ? highlighterSize
      : penSize;

  // Gentle, slow zoom adjustments (10% step)
  const handleZoomIn = () => {
    if (setZoom) {
      setZoom((z) => Math.min(5.0, Number((z + 0.10).toFixed(2))));
    }
  };

  const handleZoomOut = () => {
    if (setZoom) {
      setZoom((z) => Math.max(0.5, Number((z - 0.10).toFixed(2))));
    }
  };

  const handleResetZoom = () => {
    if (setZoom) setZoom(1);
    if (setPan) setPan({ x: 0, y: 0 });
  };

  return (
    <div className="annotation-toolbar" onClick={(e) => e.stopPropagation()}>
      {/* 1. PEN TOOL BUTTON */}
      <button
        type="button"
        className={`annotation-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
        onClick={() => setActiveTool('pen')}
        title="Pen Tool (Freehand drawing)"
      >
        <Pencil size={14} />
        <span>Pen</span>
        <span
          className="annotation-color-dot-indicator"
          style={{ backgroundColor: color }}
        />
      </button>

      {/* 2. HIGHLIGHTER TOOL BUTTON */}
      <button
        type="button"
        className={`annotation-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
        onClick={() => {
          setActiveTool('highlighter');
          // If switching to highlighter and color is red/black, set to standard bright yellow
          if (color === '#EF4444' || color === '#000000') {
            setColor('#F59E0B');
          }
        }}
        title="Highlighter Tool (Semi-transparent highlighting)"
      >
        <Highlighter size={14} />
        <span>Highlighter</span>
        <span
          className="annotation-color-dot-indicator"
          style={{
            backgroundColor: color,
            opacity: activeTool === 'highlighter' ? opacity : 0.6,
          }}
        />
      </button>

      {/* 3. ERASER TOOL BUTTON */}
      <button
        type="button"
        className={`annotation-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
        onClick={() => setActiveTool('eraser')}
        title="Eraser Tool (Erase annotations)"
      >
        <Eraser size={14} />
        <span>Eraser</span>
      </button>

      {/* 4. PAN / HAND TOOL BUTTON */}
      <button
        type="button"
        className={`annotation-tool-btn ${activeTool === 'pan' ? 'active' : ''}`}
        onClick={() => setActiveTool('pan')}
        title="Pan / Hand Tool (Drag or swipe touchpad to move slide)"
      >
        <Hand size={14} />
        <span>Pan</span>
      </button>

      <div className="annotation-toolbar-divider" />

      {/* 5. COLOR PALETTE SELECTOR */}
      <div className="annotation-menu-wrap" ref={colorMenuRef}>
        <button
          type="button"
          className={`annotation-tool-btn ${showColorMenu ? 'active' : ''}`}
          onClick={() => {
            setShowColorMenu(!showColorMenu);
            setShowSizeMenu(false);
            setShowOpacityMenu(false);
          }}
          disabled={activeTool === 'eraser' || activeTool === 'pan'}
          title={activeTool === 'eraser' ? 'Colors disabled for Eraser' : 'Color Options'}
        >
          <div
            className="annotation-color-swatch-badge"
            style={{
              backgroundColor: color,
              opacity: activeTool === 'highlighter' ? opacity : 1,
            }}
          />
          <Palette size={13} />
          <span>Color</span>
        </button>

        {showColorMenu && activeTool !== 'eraser' && activeTool !== 'pan' && (
          <div className="annotation-popover annotation-color-popover animate-scale-in">
            <div className="annotation-popover-header">Choose Color</div>
            <div className="annotation-color-grid">
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={`annotation-color-chip ${color === c.hex ? 'selected' : ''}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => {
                    setColor(c.hex);
                    setShowColorMenu(false);
                  }}
                  title={c.name}
                >
                  {color === c.hex && (
                    <Check
                      size={11}
                      style={{
                        color: c.hex === '#FFFFFF' || c.hex === '#F59E0B' ? '#000000' : '#FFFFFF',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="annotation-custom-color-row">
              <span className="annotation-popover-label">Custom:</span>
              <input
                type="color"
                className="annotation-color-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span className="annotation-color-hex">{color.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* 6. OPACITY SELECTOR */}
      {(activeTool === 'highlighter' || activeTool === 'pen') && (
        <div className="annotation-menu-wrap" ref={opacityMenuRef}>
          <button
            type="button"
            className={`annotation-tool-btn ${showOpacityMenu ? 'active' : ''}`}
            onClick={() => {
              setShowOpacityMenu(!showOpacityMenu);
              setShowColorMenu(false);
              setShowSizeMenu(false);
            }}
            title="Highlighter / Pen Opacity"
          >
            <Sliders size={13} />
            <span>Opacity ({Math.round(opacity * 100)}%)</span>
          </button>

          {showOpacityMenu && (
            <div className="annotation-popover annotation-opacity-popover animate-scale-in">
              <div className="annotation-popover-header">
                Tool Opacity: {Math.round(opacity * 100)}%
              </div>

              {/* Presets */}
              <div className="annotation-size-options" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {OPACITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`annotation-size-option-btn ${
                      Math.abs(opacity - opt.value) < 0.05 ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (setOpacity) setOpacity(opt.value);
                      setShowOpacityMenu(false);
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="annotation-custom-color-row" style={{ marginTop: 10 }}>
                <span className="annotation-popover-label" style={{ minWidth: 45 }}>
                  Slider:
                </span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={Math.round(opacity * 100)}
                  onChange={(e) => {
                    if (setOpacity) setOpacity(Number(e.target.value) / 100);
                  }}
                  style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. SIZE SELECTOR */}
      <div className="annotation-menu-wrap" ref={sizeMenuRef}>
        <button
          type="button"
          className={`annotation-tool-btn ${showSizeMenu ? 'active' : ''}`}
          onClick={() => {
            setShowSizeMenu(!showSizeMenu);
            setShowColorMenu(false);
            setShowOpacityMenu(false);
          }}
          disabled={activeTool === 'pan'}
          title="Stroke / Thickness"
        >
          <div className="annotation-size-preview-dot-wrap">
            <div
              className="annotation-size-preview-dot"
              style={{
                width: Math.min(14, Math.max(4, currentSizeVal / 2)),
                height: Math.min(14, Math.max(4, currentSizeVal / 2)),
                backgroundColor: activeTool === 'eraser' ? '#94A3B8' : color,
                opacity: activeTool === 'highlighter' ? opacity : 1,
              }}
            />
          </div>
          <span>Size</span>
        </button>

        {showSizeMenu && activeTool !== 'pan' && (
          <div className="annotation-popover annotation-size-popover animate-scale-in">
            <div className="annotation-popover-header">
              {activeTool === 'eraser'
                ? 'Eraser Thickness'
                : activeTool === 'highlighter'
                ? 'Highlighter Thickness'
                : 'Pen Thickness'}
            </div>
            <div className="annotation-size-options">
              {currentSizes.map((sz) => (
                <button
                  key={sz.value}
                  type="button"
                  className={`annotation-size-option-btn ${
                    currentSizeVal === sz.value ? 'selected' : ''
                  }`}
                  onClick={() => {
                    if (activeTool === 'eraser') {
                      setEraserSize(sz.value);
                    } else if (activeTool === 'highlighter') {
                      if (setHighlighterSize) setHighlighterSize(sz.value);
                    } else {
                      setPenSize(sz.value);
                    }
                    setShowSizeMenu(false);
                  }}
                >
                  <div
                    className="annotation-size-icon-dot"
                    style={{
                      width: Math.min(18, Math.max(4, sz.value / (activeTool === 'eraser' ? 2.5 : activeTool === 'highlighter' ? 2.2 : 1.2))),
                      height: Math.min(18, Math.max(4, sz.value / (activeTool === 'eraser' ? 2.5 : activeTool === 'highlighter' ? 2.2 : 1.2))),
                      backgroundColor: activeTool === 'eraser' ? '#94A3B8' : color,
                      opacity: activeTool === 'highlighter' ? opacity : 1,
                    }}
                  />
                  <span>{sz.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="annotation-toolbar-divider" />

      {/* 6. GENTLE SMOOTH ZOOM CONTROLS */}
      <div className="annotation-zoom-group">
        <button
          type="button"
          className="annotation-tool-btn icon-only"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          title="Zoom Out (Touchpad pinch-in or Ctrl+scroll)"
        >
          <ZoomOut size={13} />
        </button>

        <button
          type="button"
          className="annotation-zoom-badge"
          onClick={handleResetZoom}
          title="Click to reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          className="annotation-tool-btn icon-only"
          onClick={handleZoomIn}
          disabled={zoom >= 5.0}
          title="Zoom In (Touchpad pinch-out or Ctrl+scroll)"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      <div className="annotation-toolbar-divider" />

      {/* 7. UNDO BUTTON */}
      <button
        type="button"
        className="annotation-tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last stroke (Ctrl+Z)"
      >
        <RotateCcw size={13} />
        <span>Undo</span>
      </button>

      {/* 8. REDO BUTTON */}
      <button
        type="button"
        className="annotation-tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo stroke (Ctrl+Y)"
      >
        <RotateCw size={13} />
        <span>Redo</span>
      </button>

      {/* 9. CLEAR ALL BUTTON */}
      <button
        type="button"
        className="annotation-tool-btn danger"
        onClick={onClearAll}
        disabled={strokeCount === 0}
        title="Clear all annotations on this screenshot"
      >
        <Trash2 size={13} />
        <span>Clear All</span>
      </button>
    </div>
  );
}
