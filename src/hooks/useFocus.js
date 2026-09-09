import { useState, useEffect, useMemo } from 'react';
import { playChime, showNotification } from '../services/notifications';
import { getLocalDateString } from '../utils/dateUtils';

const FOCUS_STORAGE_KEY = 'deskflow_focus_history_v2';
const POMO_CONFIG_KEY = 'deskflow_focus_config_v2';

const DEFAULT_POMO_MODES = {
  focus: { label: 'Focus', seconds: 25 * 60 },
  shortBreak: { label: 'Short Break', seconds: 5 * 60 },
  longBreak: { label: 'Long Break', seconds: 15 * 60 },
};

export function useFocus(tasks = [], soundEnabled = true) {
  // Mode: 'pomodoro' | 'stopwatch' | 'countdown' | 'deepwork' | 'history'
  const [activeTab, setActiveTab] = useState('pomodoro');

  // --- Pomodoro State ---
  const [pomoMode, setPomoMode] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'
  const [pomoTimeLeft, setPomoTimeLeft] = useState(DEFAULT_POMO_MODES.focus.seconds);
  const [isPomoRunning, setIsPomoRunning] = useState(false);

  // --- Stopwatch State ---
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchLaps, setStopwatchLaps] = useState([]);

  // --- Countdown State ---
  const [countdownDuration, setCountdownDuration] = useState(15 * 60); // 15 mins default
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(15 * 60);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);

  // --- Task Binding & Deep Work ---
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [isDeepWorkActive, setIsDeepWorkActive] = useState(false);

  // --- History & Streaks ---
  const [history, setHistory] = useState(() => {
    try {
      const data = localStorage.getItem(FOCUS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save focus history', err);
    }
  }, [history]);

  // Log a completed session
  const recordSession = (type, durationSeconds, taskId = null) => {
    const activeTask = tasks.find((t) => t.id === taskId);
    const newEntry = {
      id: 'foc-' + Date.now(),
      type, // 'pomodoro' | 'countdown' | 'stopwatch' | 'deepwork'
      durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
      date: getLocalDateString(),
      timestamp: Date.now(),
      taskId: taskId || null,
      taskTitle: activeTask ? activeTask.title : null,
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  // --- Pomodoro Ticker ---
  useEffect(() => {
    let timer = null;
    if (isPomoRunning && pomoTimeLeft > 0) {
      timer = setInterval(() => {
        setPomoTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (pomoTimeLeft === 0 && isPomoRunning) {
      setIsPomoRunning(false);
      if (soundEnabled) playChime('pomo');

      const isFocus = pomoMode === 'focus';
      const title = isFocus ? 'Focus Session Completed! 🍅' : 'Break Finished!';
      const body = isFocus
        ? 'Great work! Take a 5-minute breather.'
        : 'Break over. Ready to start focusing again?';
      showNotification(title, body);

      if (isFocus) {
        recordSession('pomodoro', DEFAULT_POMO_MODES.focus.seconds, activeTaskId);
        setPomoMode('shortBreak');
        setPomoTimeLeft(DEFAULT_POMO_MODES.shortBreak.seconds);
      } else {
        setPomoMode('focus');
        setPomoTimeLeft(DEFAULT_POMO_MODES.focus.seconds);
      }
    }

    return () => clearInterval(timer);
  }, [isPomoRunning, pomoTimeLeft, pomoMode, activeTaskId, soundEnabled]);

  // --- Stopwatch Ticker ---
  useEffect(() => {
    let timer = null;
    if (isStopwatchRunning) {
      timer = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStopwatchRunning]);

  // --- Countdown Ticker ---
  useEffect(() => {
    let timer = null;
    if (isCountdownRunning && countdownTimeLeft > 0) {
      timer = setInterval(() => {
        setCountdownTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (countdownTimeLeft === 0 && isCountdownRunning) {
      setIsCountdownRunning(false);
      if (soundEnabled) playChime('complete');
      showNotification('Countdown Complete! ⏰', 'Your countdown timer has reached zero.');
      recordSession('countdown', countdownDuration, activeTaskId);
    }

    return () => clearInterval(timer);
  }, [isCountdownRunning, countdownTimeLeft, countdownDuration, activeTaskId, soundEnabled]);

  // Pomodoro Controls
  const switchPomoMode = (modeKey) => {
    setPomoMode(modeKey);
    setPomoTimeLeft(DEFAULT_POMO_MODES[modeKey].seconds);
    setIsPomoRunning(false);
  };

  const resetPomo = () => {
    setPomoTimeLeft(DEFAULT_POMO_MODES[pomoMode].seconds);
    setIsPomoRunning(false);
  };

  // Stopwatch Controls
  const toggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const resetStopwatch = () => {
    if (stopwatchSeconds > 60) {
      recordSession('stopwatch', stopwatchSeconds, activeTaskId);
    }
    setStopwatchSeconds(0);
    setIsStopwatchRunning(false);
    setStopwatchLaps([]);
  };

  const recordLap = () => {
    const lapNumber = stopwatchLaps.length + 1;
    const prevTotal = stopwatchLaps[0]?.totalTime || 0;
    const lapTime = stopwatchSeconds - prevTotal;
    setStopwatchLaps([
      { id: 'lap-' + Date.now(), lapNumber, lapTime, totalTime: stopwatchSeconds },
      ...stopwatchLaps,
    ]);
  };

  // Countdown Controls
  const setCountdownPreset = (seconds) => {
    setCountdownDuration(seconds);
    setCountdownTimeLeft(seconds);
    setIsCountdownRunning(false);
  };

  const resetCountdown = () => {
    setCountdownTimeLeft(countdownDuration);
    setIsCountdownRunning(false);
  };

  // Streak & Statistics
  const todayStr = getLocalDateString();

  const metrics = useMemo(() => {
    const todaySessions = history.filter((h) => h.date === todayStr);
    const totalFocusMinutesToday = todaySessions.reduce((acc, h) => acc + h.durationMinutes, 0);

    // Calculate daily streak
    const datesSet = new Set(history.map((h) => h.date));
    let streak = 0;
    const checkDate = new Date();

    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (datesSet.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no sessions yet, check if yesterday had one so streak isn't broken
        if (streak === 0 && dStr === todayStr) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yestStr = getLocalDateString(checkDate);
          if (datesSet.has(yestStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return {
      todayCount: todaySessions.length,
      todayMinutes: totalFocusMinutesToday,
      streak,
      totalSessions: history.length,
    };
  }, [history, todayStr]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return {
    activeTab,
    setActiveTab,
    // Pomodoro
    pomoMode,
    pomoTimeLeft,
    isPomoRunning,
    setIsPomoRunning,
    switchPomoMode,
    resetPomo,
    pomoConfig: DEFAULT_POMO_MODES,
    // Stopwatch
    stopwatchSeconds,
    isStopwatchRunning,
    stopwatchLaps,
    toggleStopwatch,
    resetStopwatch,
    recordLap,
    // Countdown
    countdownDuration,
    countdownTimeLeft,
    isCountdownRunning,
    setIsCountdownRunning,
    setCountdownPreset,
    resetCountdown,
    // Deep Work
    isDeepWorkActive,
    setIsDeepWorkActive,
    activeTaskId,
    setActiveTaskId,
    activeTask,
    // History & Streaks
    history,
    metrics,
  };
}
