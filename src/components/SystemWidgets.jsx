import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Battery,
  BatteryCharging,
  CloudSun,
  Clock as ClockIcon,
  Wifi,
  ArrowDown,
  ArrowUp,
  Database,
  Activity,
} from 'lucide-react';
import { useSystemStats } from '../hooks/useSystemStats';
import { formatLiveClockWithSeconds } from '../utils/dateUtils';

export function SystemWidgets() {
  const stats = useSystemStats();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Clock & Weather Combo Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 120, 212, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockIcon size={16} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>
              {formatLiveClockWithSeconds(time)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Live Windows Clock</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CloudSun size={18} style={{ color: '#f59e0b' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{stats.weather.temp}°C</div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{stats.weather.condition}</div>
          </div>
        </div>
      </div>

      {/* Hardware Monitoring Grid 1: CPU & RAM */}
      <div className="system-widgets-grid">
        {/* 1. CPU Monitor */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>CPU Usage</span>
            <Cpu size={14} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="stat-value">{stats.cpuPercent}%</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${stats.cpuPercent}%`,
                background: stats.cpuPercent > 80 ? '#ef4444' : 'var(--accent-primary)',
              }}
            />
          </div>
          <div className="stat-subtext">Active load</div>
        </div>

        {/* 2. RAM Monitor */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>RAM Usage</span>
            <HardDrive size={14} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="stat-value">{stats.memPercent}%</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${stats.memPercent}%`,
                background: stats.memPercent > 85 ? '#ef4444' : '#8b5cf6',
              }}
            />
          </div>
          <div className="stat-subtext">{stats.usedMemGB} / {stats.totalMemGB} GB</div>
        </div>
      </div>

      {/* Hardware Monitoring Grid 2: Network & Disk */}
      <div className="system-widgets-grid">
        {/* 3. Network Speed */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Network Speed</span>
            <Wifi size={14} style={{ color: '#06b6d4' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 700, color: '#10b981' }}>
              <ArrowDown size={12} />
              <span>{stats.downloadMBs}</span>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>MB/s</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              <ArrowUp size={11} />
              <span>{stats.uploadMBs}</span>
              <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>MB/s</span>
            </div>
          </div>
          <div className="stat-subtext">Live Throughput</div>
        </div>

        {/* 4. Disk Storage (C: Drive) */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span>Disk (C:)</span>
            <Database size={14} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value">{stats.diskPercent}%</div>
          <div className="stat-bar">
            <div
              className="stat-bar-fill"
              style={{
                width: `${stats.diskPercent}%`,
                background: stats.diskPercent > 90 ? '#ef4444' : '#f59e0b',
              }}
            />
          </div>
          <div className="stat-subtext">{stats.diskFreeGB} GB free of {stats.diskTotalGB} GB</div>
        </div>
      </div>

      {/* 5. Battery Status */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stats.isCharging ? (
            <BatteryCharging size={16} style={{ color: '#10b981' }} />
          ) : (
            <Battery size={16} style={{ color: 'var(--text-secondary)' }} />
          )}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>
              Battery {stats.batteryPercent}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {stats.isCharging ? 'Charging on AC power' : 'Running on battery'}
            </div>
          </div>
        </div>
        <div style={{ width: 60, height: 6, background: 'var(--bg-subtle)', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${stats.batteryPercent}%`,
              height: '100%',
              background: stats.batteryPercent < 20 ? '#ef4444' : '#10b981',
              borderRadius: 9999,
            }}
          />
        </div>
      </div>
    </div>
  );
}
