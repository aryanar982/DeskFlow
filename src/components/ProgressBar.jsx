import React from 'react';
import { CheckCircle2, Award } from 'lucide-react';

export function ProgressBar({ stats, isCompactMode = false }) {
  const { percentage, completed, total } = stats;
  const isAllComplete = total > 0 && completed === total;

  if (isCompactMode) {
    return (
      <div className="progress-card is-compact-progress" title={`${completed} of ${total} tasks completed (${percentage}%)`}>
        <div className="progress-compact-row">
          <span className="progress-compact-label">
            {isAllComplete ? (
              <>
                <Award size={11} style={{ color: '#10b981' }} /> All Caught Up!
              </>
            ) : (
              <>
                <CheckCircle2 size={11} style={{ color: 'var(--accent-primary)' }} /> {completed} of {total} done
              </>
            )}
          </span>
          <span className="compact-progress-pct">{percentage}%</span>
        </div>
        <div className="progress-track compact-track">
          <div
            className={`progress-fill ${isAllComplete ? 'complete' : ''}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="progress-card">
      <div className="progress-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAllComplete ? (
            <Award size={13} style={{ color: '#10b981' }} />
          ) : (
            <CheckCircle2 size={13} style={{ color: 'var(--accent-primary)' }} />
          )}
          {isAllComplete ? 'All Tasks Completed!' : 'Progress'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <span className="progress-fraction">{completed}/{total}</span>
          <span className="progress-percent-bold">({percentage}%)</span>
        </span>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${isAllComplete ? 'complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
