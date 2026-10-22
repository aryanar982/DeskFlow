import React, { useState, useEffect } from 'react';
import { Atom, Shield } from 'lucide-react';

/**
 * Windows 11 Snap Layouts Flyout
 * Replicates the authentic Windows 11 Snap Assist menu triggered by the Maximize/Snap button.
 */
export const SNAP_LAYOUTS = [
  // Layout 1: Two Equal Columns (50% / 50%)
  {
    id: 'two-col-equal',
    title: 'Two equal columns',
    zones: [
      { id: 'left', label: 'Snap to Left Half', xPercent: 0, yPercent: 0, widthPercent: 0.5, heightPercent: 1.0 },
      { id: 'right', label: 'Snap to Right Half', xPercent: 0.5, yPercent: 0, widthPercent: 0.5, heightPercent: 1.0, defaultIcon: 'atom' },
    ],
  },
  // Layout 2: Left 50% + Right Stacked (25% / 25%)
  {
    id: 'three-zone-right-split',
    title: 'Left half, two stacked on right',
    zones: [
      { id: 'left', label: 'Snap to Left Half', xPercent: 0, yPercent: 0, widthPercent: 0.5, heightPercent: 1.0 },
      { id: 'top-right', label: 'Snap to Top-Right', xPercent: 0.5, yPercent: 0, widthPercent: 0.5, heightPercent: 0.5, defaultIcon: 'atom' },
      { id: 'bottom-right', label: 'Snap to Bottom-Right', xPercent: 0.5, yPercent: 0.5, widthPercent: 0.5, heightPercent: 0.5, defaultIcon: 'shield' },
    ],
  },
  // Layout 3: Three Equal Columns (33.3% / 33.4% / 33.3%)
  {
    id: 'three-col-equal',
    title: 'Three equal columns',
    zones: [
      { id: 'left', label: 'Snap to Left Third', xPercent: 0, yPercent: 0, widthPercent: 0.3333, heightPercent: 1.0 },
      { id: 'center', label: 'Snap to Center Third', xPercent: 0.3333, yPercent: 0, widthPercent: 0.3334, heightPercent: 1.0 },
      { id: 'right', label: 'Snap to Right Third', xPercent: 0.6667, yPercent: 0, widthPercent: 0.3333, heightPercent: 1.0 },
    ],
  },
  // Layout 4: Two Unequal Columns (Priority 67% / 33%)
  {
    id: 'two-col-unequal',
    title: 'Left two-thirds, right one-third',
    zones: [
      { id: 'left', label: 'Snap to Left Two-Thirds', xPercent: 0, yPercent: 0, widthPercent: 0.6667, heightPercent: 1.0 },
      { id: 'right', label: 'Snap to Right One-Third', xPercent: 0.6667, yPercent: 0, widthPercent: 0.3333, heightPercent: 1.0 },
    ],
  },
  // Layout 5: Left Two-Thirds + Right Stacked
  {
    id: 'three-zone-priority',
    title: 'Left two-thirds, right stacked',
    zones: [
      { id: 'left', label: 'Snap to Left Two-Thirds', xPercent: 0, yPercent: 0, widthPercent: 0.6667, heightPercent: 1.0 },
      { id: 'top-right', label: 'Snap to Top-Right', xPercent: 0.6667, yPercent: 0, widthPercent: 0.3333, heightPercent: 0.5 },
      { id: 'bottom-right', label: 'Snap to Bottom-Right', xPercent: 0.6667, yPercent: 0.5, widthPercent: 0.3333, heightPercent: 0.5 },
    ],
  },
  // Layout 6: Four Equal Quadrants (2x2 Grid)
  {
    id: 'four-quadrants',
    title: 'Four equal quadrants',
    zones: [
      { id: 'top-left', label: 'Snap to Top-Left', xPercent: 0, yPercent: 0, widthPercent: 0.5, heightPercent: 0.5 },
      { id: 'top-right', label: 'Snap to Top-Right', xPercent: 0.5, yPercent: 0, widthPercent: 0.5, heightPercent: 0.5 },
      { id: 'bottom-left', label: 'Snap to Bottom-Left', xPercent: 0, yPercent: 0.5, widthPercent: 0.5, heightPercent: 0.5 },
      { id: 'bottom-right', label: 'Snap to Bottom-Right', xPercent: 0.5, yPercent: 0.5, widthPercent: 0.5, heightPercent: 0.5 },
    ],
  },
];

export function SnapLayoutsFlyout({ onSnapZone, onMouseEnter, onMouseLeave, onClose }) {
  const [hoveredZoneKey, setHoveredZoneKey] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="snap-flyout-container"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
      id="snap-layouts-flyout"
      role="menu"
      aria-label="Windows 11 Snap Layouts"
    >
      <div className="snap-flyout-grid">
        {SNAP_LAYOUTS.map((layout) => (
          <div
            key={layout.id}
            className="snap-card"
            title={layout.title}
          >
            {layout.zones.map((zone) => {
              const zoneKey = `${layout.id}:${zone.id}`;
              const isHovered = hoveredZoneKey === zoneKey;

              return (
                <div
                  key={zone.id}
                  className={`snap-zone ${isHovered ? 'hovered' : ''}`}
                  style={{
                    left: `calc(${zone.xPercent * 100}% + 2px)`,
                    top: `calc(${zone.yPercent * 100}% + 2px)`,
                    width: `calc(${zone.widthPercent * 100}% - 4px)`,
                    height: `calc(${zone.heightPercent * 100}% - 4px)`,
                  }}
                  onMouseEnter={() => setHoveredZoneKey(zoneKey)}
                  onMouseLeave={() => setHoveredZoneKey(null)}
                  onClick={() => onSnapZone(zone)}
                  title={zone.label}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSnapZone(zone);
                    }
                  }}
                >
                  {isHovered ? (
                    <Atom size={16} className="snap-icon-atom active animate-pulse" />
                  ) : zone.defaultIcon === 'atom' ? (
                    <Atom size={15} className="snap-icon-atom faint" />
                  ) : zone.defaultIcon === 'shield' ? (
                    <Shield size={15} className="snap-icon-shield faint" />
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
