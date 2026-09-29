import { getLocalDateString } from './dateUtils';

// Day of week labels
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Normalizes task completion date string (YYYY-MM-DD)
 */
export function getTaskCompletedDate(task) {
  if (!task.completed) return null;
  if (task.completedAt) {
    return getLocalDateString(new Date(task.completedAt));
  }
  return task.dueDate || null;
}

/**
 * Normalizes task creation date string (YYYY-MM-DD)
 */
export function getTaskCreatedDate(task) {
  if (task.createdAt) {
    return getLocalDateString(new Date(task.createdAt));
  }
  return task.dueDate || getLocalDateString();
}

/**
 * Calculate Streaks and 10-Week Activity Heatmap
 */
export function calculateStreaks(tasks = [], focusHistory = []) {
  const activityMap = {};

  // Log completed tasks into activity map
  tasks.forEach((t) => {
    const d = getTaskCompletedDate(t);
    if (d) {
      if (!activityMap[d]) activityMap[d] = { completedTasks: 0, focusMinutes: 0 };
      activityMap[d].completedTasks += 1;
    }
  });

  // Log focus minutes into activity map
  focusHistory.forEach((f) => {
    const d = f.date || (f.timestamp ? getLocalDateString(new Date(f.timestamp)) : null);
    if (d) {
      if (!activityMap[d]) activityMap[d] = { completedTasks: 0, focusMinutes: 0 };
      activityMap[d].focusMinutes += Number(f.durationMinutes) || 0;
    }
  });

  // Calculate Current Streak
  const todayStr = getLocalDateString();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  let currentStreak = 0;
  let cursor = new Date();

  // If no activity today, check if yesterday had activity to continue streak
  const hasActivityToday = activityMap[todayStr] && (activityMap[todayStr].completedTasks > 0 || activityMap[todayStr].focusMinutes > 0);
  const hasActivityYesterday = activityMap[yesterdayStr] && (activityMap[yesterdayStr].completedTasks > 0 || activityMap[yesterdayStr].focusMinutes > 0);

  if (hasActivityToday) {
    currentStreak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else if (hasActivityYesterday) {
    cursor.setDate(cursor.getDate() - 1);
  } else {
    currentStreak = 0;
    cursor = null;
  }

  if (cursor) {
    while (true) {
      const dateStr = getLocalDateString(cursor);
      const act = activityMap[dateStr];
      if (act && (act.completedTasks > 0 || act.focusMinutes > 0)) {
        if (!hasActivityToday && currentStreak === 0) {
          currentStreak = 1;
        } else if (currentStreak > 0 && dateStr !== todayStr) {
          currentStreak += 1;
        }
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate Longest Streak
  const activeDates = Object.keys(activityMap)
    .filter((d) => activityMap[d].completedTasks > 0 || activityMap[d].focusMinutes > 0)
    .sort();

  let longestStreak = activeDates.length > 0 ? 1 : 0;
  let tempStreak = 1;

  for (let i = 1; i < activeDates.length; i++) {
    const prev = new Date(activeDates[i - 1]);
    const curr = new Date(activeDates[i]);
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Generate 70-day (10 weeks) Contribution Heatmap
  const heatmap = [];
  const today = new Date();
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);
    const act = activityMap[dStr] || { completedTasks: 0, focusMinutes: 0 };
    const count = act.completedTasks;
    const focusMins = act.focusMinutes;

    // Intensity level 0-4
    let intensity = 0;
    if (count >= 5 || focusMins >= 120) intensity = 4;
    else if (count >= 3 || focusMins >= 60) intensity = 3;
    else if (count >= 2 || focusMins >= 30) intensity = 2;
    else if (count >= 1 || focusMins > 0) intensity = 1;

    heatmap.push({
      date: dStr,
      dayOfWeek: d.getDay(),
      dayName: DAY_NAMES_SHORT[d.getDay()],
      tasksCount: count,
      focusMinutes: focusMins,
      intensity,
    });
  }

  return {
    currentStreak,
    longestStreak,
    activityMap,
    heatmap,
  };
}

/**
 * Calculate Actionable Insights & Behavioral Analytics
 */
export function calculateInsights(tasks = [], focusHistory = []) {
  // 1. Best Working Hours (0 - 23)
  const hourlyCount = Array(24).fill(0);

  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const hour = new Date(t.completedAt).getHours();
      if (hour >= 0 && hour < 24) hourlyCount[hour] += 1;
    }
  });

  focusHistory.forEach((f) => {
    if (f.timestamp) {
      const hour = new Date(f.timestamp).getHours();
      if (hour >= 0 && hour < 24) hourlyCount[hour] += 1;
    }
  });

  let maxHour = 10;
  let maxCount = 0;
  for (let h = 0; h < 24; h++) {
    // 3-hour sliding window
    const windowSum = (hourlyCount[h] || 0) + (hourlyCount[(h + 1) % 24] || 0) + (hourlyCount[(h + 2) % 24] || 0);
    if (windowSum > maxCount) {
      maxCount = windowSum;
      maxHour = h;
    }
  }

  const formatHourLabel = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${ampm}`;
  };
  const peakWindowStr = `${formatHourLabel(maxHour)} – ${formatHourLabel((maxHour + 3) % 24)}`;

  // 2. Most Productive Days of Week
  const dayCounts = Array(7).fill(0);
  tasks.forEach((t) => {
    if (t.completed && t.completedAt) {
      const day = new Date(t.completedAt).getDay();
      dayCounts[day] += 1;
    }
  });

  let bestDayIdx = 2; // Default Tuesday
  let bestDayCount = -1;
  dayCounts.forEach((cnt, idx) => {
    if (cnt > bestDayCount) {
      bestDayCount = cnt;
      bestDayIdx = idx;
    }
  });
  const bestDayName = DAY_NAMES_FULL[bestDayIdx];

  // 3. Deadline Adherence & Missed Deadlines
  let totalTasksWithDue = 0;
  let onTimeCompleted = 0;
  let lateCompleted = 0;
  let pendingOverdue = 0;

  const todayStr = getLocalDateString();

  tasks.forEach((t) => {
    if (t.dueDate) {
      totalTasksWithDue++;
      if (t.completed) {
        const compDate = getTaskCompletedDate(t);
        if (compDate && compDate <= t.dueDate) {
          onTimeCompleted++;
        } else {
          lateCompleted++;
        }
      } else {
        if (t.dueDate < todayStr) {
          pendingOverdue++;
        }
      }
    }
  });

  const onTimeRate = (onTimeCompleted + lateCompleted) > 0
    ? Math.round((onTimeCompleted / (onTimeCompleted + lateCompleted)) * 100)
    : 100;

  // 4. Category & Priority Completion Rates
  const categoryStats = {};
  const priorityStats = {
    urgent: { total: 0, completed: 0 },
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  };

  tasks.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
    categoryStats[cat].total += 1;
    if (t.completed) categoryStats[cat].completed += 1;

    const pri = (t.priority || 'medium').toLowerCase();
    if (priorityStats[pri]) {
      priorityStats[pri].total += 1;
      if (t.completed) priorityStats[pri].completed += 1;
    }
  });

  // Calculate Overall Completion Rate
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 5. Smart Recommendations & Tips
  const tips = [];
  if (pendingOverdue > 0) {
    tips.push(`You have ${pendingOverdue} overdue task${pendingOverdue > 1 ? 's' : ''}. Reschedule or tackle them first.`);
  }
  if (onTimeRate >= 85) {
    tips.push(`Superb punctuality! ${onTimeRate}% on-time completion rate over tracked deadlines.`);
  } else {
    tips.push('Aim to break larger projects into subtasks to keep deadlines on target.');
  }
  tips.push(`Your natural peak performance window is ${peakWindowStr}. Schedule complex tasks here.`);

  return {
    bestHourWindow: peakWindowStr,
    hourlyDistribution: hourlyCount,
    bestDayName,
    bestDayStats: { day: bestDayName, count: bestDayCount },
    dayDistribution: dayCounts,
    onTimeRate,
    onTimeCompleted,
    lateCompleted,
    pendingOverdue,
    overallRate,
    completedTasks,
    totalTasks,
    categoryStats,
    priorityStats,
    tips,
  };
}

/**
 * Computes Daily Summary
 */
export function getDailyReport(tasks = [], focusHistory = [], dateStr = getLocalDateString()) {
  const completedToday = tasks.filter((t) => getTaskCompletedDate(t) === dateStr);
  const createdToday = tasks.filter((t) => getTaskCreatedDate(t) === dateStr);

  const focusToday = focusHistory.filter((f) => {
    const d = f.date || (f.timestamp ? getLocalDateString(new Date(f.timestamp)) : null);
    return d === dateStr;
  });

  const focusMinutes = focusToday.reduce((sum, f) => sum + (Number(f.durationMinutes) || 0), 0);

  // Hourly completion distribution for today
  const hourlyCompletion = Array(24).fill(0);
  completedToday.forEach((t) => {
    if (t.completedAt) {
      const h = new Date(t.completedAt).getHours();
      hourlyCompletion[h] += 1;
    }
  });

  return {
    period: 'daily',
    date: dateStr,
    completedCount: completedToday.length,
    createdCount: createdToday.length,
    focusMinutes,
    focusHours: (focusMinutes / 60).toFixed(1),
    sessionsCount: focusToday.length,
    tasksList: completedToday,
    hourlyCompletion,
  };
}

/**
 * Computes Weekly Report (Past 7 Days rolling or current week)
 */
export function getWeeklyReport(tasks = [], focusHistory = [], referenceDate = new Date()) {
  const days = [];
  let totalCompleted = 0;
  let totalCreated = 0;
  let totalFocusMinutes = 0;

  // Past 7 days up to reference date
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);

    const completed = tasks.filter((t) => getTaskCompletedDate(t) === dStr).length;
    const created = tasks.filter((t) => getTaskCreatedDate(t) === dStr).length;

    const focusMins = focusHistory
      .filter((f) => (f.date || (f.timestamp ? getLocalDateString(new Date(f.timestamp)) : null)) === dStr)
      .reduce((sum, f) => sum + (Number(f.durationMinutes) || 0), 0);

    totalCompleted += completed;
    totalCreated += created;
    totalFocusMinutes += focusMins;

    days.push({
      date: dStr,
      dayName: DAY_NAMES_SHORT[d.getDay()],
      completed,
      created,
      focusMinutes: focusMins,
      focusHours: (focusMins / 60).toFixed(1),
    });
  }

  // Previous 7 days comparison
  let prevWeekCompleted = 0;
  for (let i = 13; i >= 7; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);
    prevWeekCompleted += tasks.filter((t) => getTaskCompletedDate(t) === dStr).length;
  }

  const deltaPercent = prevWeekCompleted > 0
    ? Math.round(((totalCompleted - prevWeekCompleted) / prevWeekCompleted) * 100)
    : totalCompleted > 0 ? 100 : 0;

  return {
    period: 'weekly',
    days,
    totalCompleted,
    totalCreated,
    totalFocusMinutes,
    totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
    dailyAverage: (totalCompleted / 7).toFixed(1),
    deltaPercent,
  };
}

/**
 * Computes Monthly Report (Past 30 Days or calendar month)
 */
export function getMonthlyReport(tasks = [], focusHistory = [], referenceDate = new Date()) {
  const weeks = [
    { label: 'Week 1', completed: 0, created: 0, focusMinutes: 0 },
    { label: 'Week 2', completed: 0, created: 0, focusMinutes: 0 },
    { label: 'Week 3', completed: 0, created: 0, focusMinutes: 0 },
    { label: 'Week 4', completed: 0, created: 0, focusMinutes: 0 },
  ];

  let totalCompleted = 0;
  let totalCreated = 0;
  let totalFocusMinutes = 0;

  // 28 days divided into 4 rolling weeks
  for (let i = 27; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);

    const completed = tasks.filter((t) => getTaskCompletedDate(t) === dStr).length;
    const created = tasks.filter((t) => getTaskCreatedDate(t) === dStr).length;
    const focusMins = focusHistory
      .filter((f) => (f.date || (f.timestamp ? getLocalDateString(new Date(f.timestamp)) : null)) === dStr)
      .reduce((sum, f) => sum + (Number(f.durationMinutes) || 0), 0);

    const weekIdx = Math.min(3, Math.floor((27 - i) / 7));
    weeks[weekIdx].completed += completed;
    weeks[weekIdx].created += created;
    weeks[weekIdx].focusMinutes += focusMins;

    totalCompleted += completed;
    totalCreated += created;
    totalFocusMinutes += focusMins;
  }

  return {
    period: 'monthly',
    weeks,
    totalCompleted,
    totalCreated,
    totalFocusMinutes,
    totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
    dailyAverage: (totalCompleted / 28).toFixed(1),
  };
}

/**
 * Computes Yearly Report (12 Months of the current year)
 */
export function getYearlyReport(tasks = [], focusHistory = [], year = new Date().getFullYear()) {
  const months = MONTH_NAMES.map((mName) => ({
    label: mName,
    completed: 0,
    created: 0,
    focusHours: 0,
  }));

  let totalCompleted = 0;
  let totalCreated = 0;
  let totalFocusMinutes = 0;

  tasks.forEach((t) => {
    const compDate = getTaskCompletedDate(t);
    if (compDate && compDate.startsWith(String(year))) {
      const mIdx = parseInt(compDate.split('-')[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        months[mIdx].completed += 1;
        totalCompleted += 1;
      }
    }

    const creDate = getTaskCreatedDate(t);
    if (creDate && creDate.startsWith(String(year))) {
      const mIdx = parseInt(creDate.split('-')[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        months[mIdx].created += 1;
        totalCreated += 1;
      }
    }
  });

  focusHistory.forEach((f) => {
    const d = f.date || (f.timestamp ? getLocalDateString(new Date(f.timestamp)) : null);
    if (d && d.startsWith(String(year))) {
      const mIdx = parseInt(d.split('-')[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        const mins = Number(f.durationMinutes) || 0;
        months[mIdx].focusHours += +(mins / 60).toFixed(1);
        totalFocusMinutes += mins;
      }
    }
  });

  return {
    period: 'yearly',
    year,
    months,
    totalCompleted,
    totalCreated,
    totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
    monthlyAverage: (totalCompleted / 12).toFixed(1),
  };
}

/**
 * Exports formatted markdown summary of user productivity
 */
export function generateMarkdownReport(activePeriod, reportData, insights, streaks) {
  const dateStr = getLocalDateString();
  return `# DeskFlow Productivity Report (${activePeriod.toUpperCase()})
Generated on: ${dateStr}

## 📊 Summary Metrics
- **Completed Tasks**: ${reportData.totalCompleted ?? reportData.completedCount ?? 0}
- **Focus Duration**: ${reportData.totalFocusHours ?? reportData.focusHours ?? 0} Hours
- **On-Time Rate**: ${insights.onTimeRate}%
- **Current Active Streak**: ${streaks.currentStreak} Days 🔥 (Best: ${streaks.longestStreak} Days 🏆)

## 💡 Key Productivity Insights
- **Peak Working Window**: ${insights.bestHourWindow}
- **Most Productive Day**: ${insights.bestDayName}
- **Overall Task Completion Rate**: ${insights.overallRate}%
- **Overdue Tasks**: ${insights.pendingOverdue}

*Exported from DeskFlow Desktop Widget v4.0*
`;
}

/**
 * Generates realistic sample activity for demonstrating the analytics suite
 */
export function generateSampleAnalyticsData() {
  const sampleTasks = [];
  const sampleFocus = [];
  const today = new Date();

  const categories = ['Work', 'Design', 'Dev', 'Personal'];
  const priorities = ['urgent', 'high', 'medium', 'low'];
  const taskTitles = [
    'Refactor Widget Theme Engine',
    'Review PR for Windows 11 Acrylic',
    'Optimize CPU & RAM polling loop',
    'Design High-Fidelity SVG Charts',
    'Sync Pomodoro timer with native chime',
    'Draft weekly sprint release notes',
    'Fix task drag-and-drop animation',
    'Audit local storage schemas',
    'Optimize multi-monitor desktop snapping',
    'Set up automated GitHub actions',
    'Add keyboard shortcuts modal',
    'Test multi-monitor DPI scaling',
  ];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = getLocalDateString(d);

    // Skip some days to make streaks realistic
    const isSkipDay = i === 12 || i === 23;
    if (isSkipDay) continue;

    const dailyTaskCount = (i % 5 === 0) ? 4 : (i % 2 === 0 ? 2 : 3);
    for (let k = 0; k < dailyTaskCount; k++) {
      const hour = 9 + (k * 3) + (i % 3); // between 9 AM and 7 PM
      const taskDate = new Date(d);
      taskDate.setHours(hour, (k * 17) % 60, 0);

      const titleIdx = (i * 3 + k) % taskTitles.length;
      sampleTasks.push({
        id: `sample-t-${i}-${k}`,
        title: taskTitles[titleIdx],
        category: categories[(i + k) % categories.length],
        priority: priorities[(i + 2 * k) % priorities.length],
        completed: true,
        completedAt: taskDate.getTime(),
        createdAt: taskDate.getTime() - 3600000 * 5,
        dueDate: dStr,
      });
    }

    // 1-3 focus sessions per active day
    const sessionCount = (i % 4 === 0) ? 3 : 2;
    for (let s = 0; s < sessionCount; s++) {
      const focusHour = 10 + s * 3;
      const fDate = new Date(d);
      fDate.setHours(focusHour, 15, 0);
      sampleFocus.push({
        id: `sample-foc-${i}-${s}`,
        type: 'pomodoro',
        durationMinutes: 25,
        date: dStr,
        timestamp: fDate.getTime(),
      });
    }
  }

  return { sampleTasks, sampleFocus };
}
