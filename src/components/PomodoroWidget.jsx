import React from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { useFocus } from '../hooks/useFocus';

export function PomodoroWidget({ tasks = [], soundEnabled = true }) {
  const {
    stopwatchSeconds,
    isStopwatchRunning,
    stopwatchLaps,
    toggleStopwatch,
    resetStopwatch,
    recordLap,
  } = useFocus(tasks, soundEnabled);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  return (
    <div className="sw-container">
      {/* Big time display */}
      <div className="sw-display">{formatTime(stopwatchSeconds)}</div>

      {/* Controls */}
      <div className="sw-controls">
        <button
          className="sw-btn-main"
          onClick={toggleStopwatch}
          aria-label={isStopwatchRunning ? 'Pause' : 'Start'}
          style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
        >
          {isStopwatchRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {isStopwatchRunning && (
          <button
            className="sw-btn-secondary"
            onClick={recordLap}
            title="Record Lap"
            aria-label="Lap"
          >
            <Flag size={14} />
          </button>
        )}

        <button
          className="sw-btn-secondary"
          onClick={resetStopwatch}
          title="Reset"
          aria-label="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Laps */}
      {stopwatchLaps.length > 0 && (
        <div className="sw-laps">
          <div className="sw-laps-header">
            <span>Lap</span>
            <span>Split</span>
            <span>Total</span>
          </div>
          <div className="sw-laps-list">
            {stopwatchLaps.map((lap) => (
              <div key={lap.id} className="sw-lap-row">
                <span className="sw-lap-num">#{lap.lapNumber}</span>
                <span className="sw-lap-split">+{formatTime(lap.lapTime)}</span>
                <span className="sw-lap-total">{formatTime(lap.totalTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const FocusWidget = PomodoroWidget;
