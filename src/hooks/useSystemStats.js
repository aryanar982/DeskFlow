import { useState, useEffect } from 'react';

export function useSystemStats() {
  const [stats, setStats] = useState({
    cpuPercent: 18,
    usedMemGB: '6.4',
    totalMemGB: '16.0',
    freeMemGB: '9.6',
    memPercent: 40,
    batteryPercent: 88,
    isCharging: true,
    downloadMBs: 3.2,
    uploadMBs: 0.8,
    diskTotalGB: '475.8',
    diskFreeGB: '223.1',
    diskPercent: 53,
    weather: {
      temp: 22,
      condition: 'Partly Cloudy',
      city: 'Local',
    },
  });

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        if (typeof window !== 'undefined' && window.deskflowAPI?.system) {
          const nativeStats = await window.deskflowAPI.system.getStats();
          if (isMounted && nativeStats) {
            setStats((prev) => ({
              ...prev,
              cpuPercent: nativeStats.cpuPercent ?? prev.cpuPercent,
              usedMemGB: nativeStats.usedMemGB ?? prev.usedMemGB,
              totalMemGB: nativeStats.totalMemGB ?? prev.totalMemGB,
              freeMemGB: nativeStats.freeMemGB ?? prev.freeMemGB,
              memPercent: nativeStats.memPercent ?? prev.memPercent,
              diskTotalGB: nativeStats.diskTotalGB ?? prev.diskTotalGB,
              diskFreeGB: nativeStats.diskFreeGB ?? prev.diskFreeGB,
              diskPercent: nativeStats.diskPercent ?? prev.diskPercent,
              downloadMBs: nativeStats.downloadMBs ?? prev.downloadMBs,
              uploadMBs: nativeStats.uploadMBs ?? prev.uploadMBs,
            }));
          }
        } else {
          // Dynamic browser simulation with subtle natural fluctuations
          if (isMounted) {
            setStats((prev) => {
              const cpuJitter = Math.floor(Math.random() * 9) - 4;
              const nextCpu = Math.min(95, Math.max(8, prev.cpuPercent + cpuJitter));
              const nextDl = +(Math.random() * 4.2 + 1.1).toFixed(1);
              const nextUl = +(Math.random() * 1.4 + 0.3).toFixed(1);

              return {
                ...prev,
                cpuPercent: nextCpu,
                downloadMBs: nextDl,
                uploadMBs: nextUl,
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to get system stats', err);
      }
    };

    // Read real Battery API if supported
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const updateBattery = () => {
          if (isMounted) {
            setStats((prev) => ({
              ...prev,
              batteryPercent: Math.round(battery.level * 100),
              isCharging: battery.charging,
            }));
          }
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }

    fetchStats();
    const interval = setInterval(fetchStats, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
