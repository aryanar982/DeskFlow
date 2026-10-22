import React, { useRef, useEffect, useState, useCallback } from 'react';
import { renderStrokesOnContext } from '../utils/annotationUtils';

export function AnnotationCanvas({
  page,
  strokes = [],
  onAddStroke,
  activeTool = 'pen',
  color = '#EF4444',
  penSize = 7,
  highlighterSize = 24,
  eraserSize = 24,
  opacity = 0.4,
  zoom = 1,
  setZoom,
  pan = { x: 0, y: 0 },
  setPan,
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0 });
  const currentStrokeRef = useRef(null);

  const [imageDimensions, setImageDimensions] = useState({
    width: page?.width || 1920,
    height: page?.height || 1080,
  });

  // Redraw canvas with all committed strokes + active stroke in progress
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderStrokesOnContext(
      ctx,
      canvas.width,
      canvas.height,
      strokes,
      currentStrokeRef.current,
      true
    );
  }, [strokes]);

  // Handle intrinsic image dimensions & layout sizing
  const handleImageLoad = (e) => {
    const naturalW = e.target.naturalWidth || page?.width || 1920;
    const naturalH = e.target.naturalHeight || page?.height || 1080;
    setImageDimensions({ width: naturalW, height: naturalH });
  };

  // Sync canvas internal buffer resolution with native image resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = imageDimensions.width;
      canvas.height = imageDimensions.height;
      redraw();
    }
  }, [imageDimensions, redraw]);

  // Redraw whenever strokes array changes
  useEffect(() => {
    redraw();
  }, [strokes, redraw]);

  // Listen for Spacebar for temporary pan mode & Arrow Keys for Zoom Panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable ||
        Boolean(e.target.closest?.('[contenteditable="true"]'))
      ) return;

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      }

      // Move view Left, Right, Up, Down when Zoomed in using Arrow Keys
      if (zoom > 1 && setPan) {
        const step = 45;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setPan((p) => ({ ...p, y: p.y + step }));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setPan((p) => ({ ...p, y: p.y - step }));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPan((p) => ({ ...p, x: p.x + step }));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setPan((p) => ({ ...p, x: p.x - step }));
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoom, setPan]);

  // Touchpad 2-finger Motion & Wheel Pinch-Zoom
  const handleWheel = (e) => {
    if (activeTool === 'none') return;
    e.preventDefault();
    e.stopPropagation();

    // Check if Ctrl key is pressed (Touchpad 2-finger pinch gesture emits Ctrl+wheel)
    if (e.ctrlKey) {
      if (!setZoom) return;
      const zoomFactor = e.deltaY < 0 ? 1.04 : 0.96;
      setZoom((prevZoom) => {
        const nextZoom = Math.min(5.0, Math.max(0.5, Number((prevZoom * zoomFactor).toFixed(2))));
        return nextZoom;
      });
    } else {
      // Touchpad 2-finger swipe / Mouse wheel panning when zoomed in or pan tool active
      if (setPan && (zoom > 1 || activeTool === 'pan')) {
        // e.deltaX = horizontal touchpad swipe, e.deltaY = vertical touchpad swipe
        setPan((prev) => ({
          x: prev.x - e.deltaX * 0.8,
          y: prev.y - e.deltaY * 0.8,
        }));
      } else if (setZoom) {
        // Standard mouse wheel zooming when zoom is 1.0
        const zoomFactor = e.deltaY < 0 ? 1.04 : 0.96;
        setZoom((prevZoom) => {
          const nextZoom = Math.min(5.0, Math.max(0.5, Number((prevZoom * zoomFactor).toFixed(2))));
          return nextZoom;
        });
      }
    }
  };

  // Double Click Zoom / Reset
  const handleDoubleClick = (e) => {
    if (activeTool === 'none') return;
    e.preventDefault();
    if (setZoom) {
      if (zoom === 1) {
        setZoom(1.8);
      } else {
        setZoom(1.0);
        if (setPan) setPan({ x: 0, y: 0 });
      }
    }
  };

  // Map mouse / touch coordinates to native image coordinate space
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    return { x, y };
  };

  // Start Drawing or Panning
  const handlePointerDown = (e) => {
    if (activeTool === 'none') return;

    // Check if Panning (Hand tool selected OR Spacebar held OR middle click OR right click)
    const isPanMode = activeTool === 'pan' || isSpacePressed || e.button === 1 || e.button === 2;

    if (isPanMode) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - (pan?.x || 0),
        y: e.clientY - (pan?.y || 0),
      };
      return;
    }

    if (e.button !== undefined && e.button !== 0) return; // Left click only for drawing

    const coords = getCanvasCoords(e);
    const isHighlighter = activeTool === 'highlighter';

    currentStrokeRef.current = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tool: activeTool,
      color: color,
      size: activeTool === 'eraser' ? eraserSize : isHighlighter ? highlighterSize : penSize,
      opacity: isHighlighter ? opacity : (activeTool === 'pen' && opacity < 1 ? opacity : 1.0),
      points: [coords],
    };

    setIsDrawing(true);
    redraw();
  };

  // Move while Drawing or Panning
  const handlePointerMove = (e) => {
    if (isPanning && setPan) {
      const nextX = e.clientX - panStartRef.current.x;
      const nextY = e.clientY - panStartRef.current.y;
      setPan({ x: nextX, y: nextY });
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) return;

    const coords = getCanvasCoords(e);
    const stroke = currentStrokeRef.current;

    if (stroke.tool === 'highlighter' || e.shiftKey) {
      // Straight line axis-snapping for Highlighter (horizontal/vertical line)
      const start = stroke.points[0];
      const dx = Math.abs(coords.x - start.x);
      const dy = Math.abs(coords.y - start.y);

      let constrainedCoords;
      if (dx >= dy) {
        // Horizontal text highlighting - lock Y coordinate to initial start Y
        constrainedCoords = { x: coords.x, y: start.y };
      } else {
        // Vertical text highlighting - lock X coordinate to initial start X
        constrainedCoords = { x: start.x, y: coords.y };
      }

      // Replace points with start and constrained end coordinate for 100% straight line
      stroke.points = [start, constrainedCoords];
    } else {
      stroke.points.push(coords);
    }

    redraw();
  };

  // End Drawing or Panning
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) return;

    const finishedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setIsDrawing(false);

    if (finishedStroke && finishedStroke.points.length > 0 && onAddStroke) {
      onAddStroke(finishedStroke);
    }
  };

  const isPanActive = activeTool === 'pan' || isSpacePressed || isPanning;

  return (
    <div
      className="annotation-viewport"
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        // Allow right-click dragging for pan without context menu
        if (activeTool !== 'none' && zoom > 1) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="annotation-canvas-container"
        ref={containerRef}
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Background Screenshot Image */}
        <img
          ref={imgRef}
          src={page.dataUrl}
          alt="Screenshot"
          className="annotation-screenshot-img"
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Overlay Canvas for Drawing */}
        <canvas
          ref={canvasRef}
          className={`annotation-overlay-canvas ${
            activeTool === 'none'
              ? 'read-only'
              : isPanActive
              ? isPanning
                ? 'grabbing-cursor'
                : 'grab-cursor'
              : activeTool === 'eraser'
              ? 'eraser-cursor'
              : 'pen-cursor'
          }`}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>

      {/* Floating Zoom Badge when Zoomed */}
      {zoom !== 1 && activeTool !== 'none' && (
        <div className="annotation-floating-zoom-tag animate-fade-in">
          <span className="zoom-val">{Math.round(zoom * 100)}%</span>

          <button
            type="button"
            className="reset-zoom-btn"
            onClick={() => {
              if (setZoom) setZoom(1);
              if (setPan) setPan({ x: 0, y: 0 });
            }}
            title="Reset Zoom to 100%"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
