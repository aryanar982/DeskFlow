import { useState, useEffect, useCallback, useRef } from 'react';
import { automationEngine } from '../utils/automationEngine';
import { getLocalDateString } from '../utils/dateUtils';

export function useAutomations({
  tasks = [],
  systemStats = {},
  setSearchQuery,
  setActiveTab,
  updateSetting,
  updateTask,
}) {
  const [rules, setRules] = useState(() => automationEngine.getRules());
  const [logs, setLogs] = useState(() => automationEngine.getLogs());

  const callbacksRef = useRef({
    setSearchQuery,
    setActiveTab,
    updateSetting,
    updateTask,
    rescheduleOverdueTasks: null,
  });

  // Calculate overdue tasks count
  const todayStr = getLocalDateString();
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);

  // Auto-reschedule helper
  const smartRescheduleOverdue = useCallback((targetDate = 'today') => {
    const newDueDate = targetDate === 'tomorrow'
      ? getLocalDateString(new Date(Date.now() + 86400000))
      : getLocalDateString();

    const overdueList = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);
    overdueList.forEach((t) => {
      if (updateTask) {
        updateTask(t.id, {
          dueDate: newDueDate,
          dueDateTime: `${newDueDate}T${t.dueTime || '12:00'}:00`,
        });
      }
    });

    return overdueList.length;
  }, [tasks, todayStr, updateTask]);

  useEffect(() => {
    callbacksRef.current = {
      setSearchQuery,
      setActiveTab,
      updateSetting,
      updateTask,
      rescheduleOverdueTasks: smartRescheduleOverdue,
    };
  }, [setSearchQuery, setActiveTab, updateSetting, updateTask, smartRescheduleOverdue]);

  // Subscribe to engine state updates
  useEffect(() => {
    const unsubscribe = automationEngine.subscribe(() => {
      setRules(automationEngine.getRules());
      setLogs(automationEngine.getLogs());
    });
    return unsubscribe;
  }, []);

  // Monitor Battery Status
  useEffect(() => {
    if (systemStats.batteryPercent !== undefined) {
      automationEngine.evaluateBattery(
        systemStats.batteryPercent,
        Boolean(systemStats.isCharging),
        callbacksRef.current
      );
    }
  }, [systemStats.batteryPercent, systemStats.isCharging]);

  // Clock Schedule Evaluation loop (every 30 seconds)
  useEffect(() => {
    const checkSchedule = () => {
      automationEngine.evaluateSchedule(callbacksRef.current);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, []);

  // Upcoming Meeting / Deadline Evaluation loop (every 60 seconds)
  useEffect(() => {
    const checkMeetings = () => {
      automationEngine.evaluateUpcomingMeetings(tasks, callbacksRef.current);
    };

    checkMeetings();
    const interval = setInterval(checkMeetings, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  // App launch trigger proxy
  const triggerAppLaunch = useCallback((appName, target) => {
    automationEngine.evaluateAppOpen(appName, target, callbacksRef.current);
  }, []);

  // Test Run
  const testRunRule = useCallback((ruleId) => {
    automationEngine.testRunRule(ruleId, callbacksRef.current);
  }, []);

  return {
    rules,
    logs,
    overdueTasksCount: overdueTasks.length,
    overdueTasks,
    toggleRule: (id) => automationEngine.toggleRule(id),
    addRule: (data) => automationEngine.addRule(data),
    deleteRule: (id) => automationEngine.deleteRule(id),
    resetToDefaults: () => automationEngine.resetToDefaults(),
    clearLogs: () => automationEngine.clearLogs(),
    testRunRule,
    triggerAppLaunch,
    smartRescheduleOverdue,
  };
}
