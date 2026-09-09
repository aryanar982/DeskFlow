import {
  format,
  isToday as dfIsToday,
  isTomorrow as dfIsTomorrow,
  isYesterday as dfIsYesterday,
  differenceInCalendarDays,
  differenceInMinutes,
  differenceInHours,
  startOfDay,
  parseISO,
} from 'date-fns';

/**
 * Returns YYYY-MM-DD string for a date in the user's LOCAL timezone.
 * Avoids UTC day-shift bugs caused by new Date().toISOString().split('T')[0].
 */
export function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD and HH:mm into a local Date instance.
 */
export function parseTaskDateTime(dueDateStr, dueTimeStr) {
  if (!dueDateStr) return null;

  // Handle ISO string if passed
  if (dueDateStr.includes('T')) {
    try {
      const d = parseISO(dueDateStr);
      return {
        date: d,
        hasTime: true,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
      };
    } catch {
      // Fall back to string parsing
    }
  }

  const [y, m, d] = dueDateStr.split('-').map(Number);
  let hour = 23;
  let minute = 59;
  let second = 59;
  let hasTime = false;

  if (dueTimeStr) {
    const parts = dueTimeStr.split(':');
    if (parts.length >= 2) {
      hour = parseInt(parts[0], 10);
      minute = parseInt(parts[1], 10);
      second = 0;
      hasTime = true;
    }
  }

  const localDate = new Date(y, m - 1, d, hour, minute, second);
  return {
    date: localDate,
    hasTime,
    year: y,
    month: m,
    day: d,
    hour,
    minute,
  };
}

/**
 * Formats a 24-hour time string ("14:30") to 12-hour AM/PM format ("2:30 PM").
 */
export function format12HourTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hour = parseInt(parts[0], 10);
  const minute = parts[1].slice(0, 2);
  const period = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${minute} ${period}`;
}

/**
 * Converts 12-hour values back to 24-hour "HH:mm" string for storage.
 */
export function formatTo24HourTime(hour12, minute, period) {
  let h = parseInt(hour12, 10);
  if (isNaN(h)) h = 12;
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  const minStr = String(minute).padStart(2, '0');
  const hrStr = String(h).padStart(2, '0');
  return `${hrStr}:${minStr}`;
}

/**
 * Parses a 24-hour time string ("14:30") to 12-hour picker values.
 */
export function parseTimeTo12Hour(time24) {
  if (!time24) {
    return { hour: 12, minute: '00', period: 'PM' };
  }
  const parts = time24.split(':');
  let hour = parseInt(parts[0], 10);
  const minute = parts[1] ? parts[1].slice(0, 2) : '00';

  if (isNaN(hour)) hour = 12;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return { hour, minute: String(minute).padStart(2, '0'), period };
}

/**
 * Formats task date and optional time according to requirements:
 * - 12-hour time format with AM/PM (e.g. 2:30 PM)
 * - If current year, omit year: "Sep 7 • 2:30 PM"
 * - If different year, show year: "Sep 7, 2026 • 2:30 PM"
 * - Human-friendly: "Today • 3:15 PM", "Tomorrow • 11:00 AM", "Mon, Sep 14 • 5:45 PM"
 *
 * @param {string|Date} dueDate - Date string YYYY-MM-DD or Date
 * @param {string} [dueTime] - Optional HH:mm
 * @param {Object} [options]
 * @param {boolean} [options.includeRelative=true] - Whether to use Today/Tomorrow/Yesterday
 * @param {boolean} [options.includeWeekday=true] - Whether to include weekday (Mon, Sep 7)
 * @param {boolean} [options.omitYearIfCurrent=true] - Omit year if same as current year
 * @param {string} [options.separator=' • '] - Separator between date and time
 */
export function formatTaskDate(dueDate, dueTime = null, options = {}) {
  if (!dueDate) return '';

  const {
    includeRelative = true,
    includeWeekday = true,
    omitYearIfCurrent = true,
    separator = ' • ',
  } = options;

  let parsed = null;
  if (typeof dueDate === 'string') {
    parsed = parseTaskDateTime(dueDate, dueTime);
  } else if (dueDate instanceof Date) {
    parsed = {
      date: dueDate,
      hasTime: Boolean(dueTime),
      year: dueDate.getFullYear(),
      month: dueDate.getMonth() + 1,
      day: dueDate.getDate(),
      hour: dueDate.getHours(),
      minute: dueDate.getMinutes(),
    };
  }

  if (!parsed || isNaN(parsed.date.getTime())) return '';

  const targetDate = parsed.date;
  const currentYear = new Date().getFullYear();
  const isSameYear = targetDate.getFullYear() === currentYear;

  let datePart = '';
  const isToday = dfIsToday(targetDate);
  const isTomorrow = dfIsTomorrow(targetDate);
  const isYesterday = dfIsYesterday(targetDate);

  if (includeRelative && isToday) {
    datePart = 'Today';
  } else if (includeRelative && isTomorrow) {
    datePart = 'Tomorrow';
  } else if (includeRelative && isYesterday) {
    datePart = 'Yesterday';
  } else {
    // Current year: Mon, Sep 8
    // Different year: Sep 8, 2026 (or Mon, Sep 8, 2026 if includeWeekday is forced)
    if (omitYearIfCurrent && isSameYear) {
      datePart = includeWeekday
        ? format(targetDate, 'EEE, MMM d')
        : format(targetDate, 'MMM d');
    } else {
      datePart = format(targetDate, 'MMM d, yyyy');
    }
  }

  const timePart = dueTime ? format12HourTime(dueTime) : '';

  if (datePart && timePart) {
    return `${datePart}${separator}${timePart}`;
  }
  return datePart || timePart;
}

/**
 * Shared reusable formatter alias for general date & time display throughout the app.
 * Outputs:
 * - "Today • 2:30 PM"
 * - "Tomorrow • 9:00 AM"
 * - "Mon, Sep 8 • 2:30 PM"
 * - "Sep 8, 2026 • 2:30 PM"
 */
export const formatDateTime = formatTaskDate;

/**
 * Formats a live clock with seconds in 12-hour AM/PM format ("1:42:05 PM").
 */
export function formatLiveClockWithSeconds(date = new Date()) {
  return format(date, 'h:mm:ss a');
}

/**
 * Computes relative due status:
 * - "Due in 2 hours"
 * - "Due Tomorrow"
 * - "Overdue by 1 day"
 * - "Due Today • 4:00 PM"
 *
 * @param {string} dueDate - YYYY-MM-DD
 * @param {string} dueTime - HH:mm
 * @param {boolean} completed - Task completed status
 * @returns {{ isOverdue: boolean, statusText: string, fullFormatted: string }}
 */
export function getDueStatus(dueDate, dueTime, completed = false) {
  if (completed) {
    return {
      isOverdue: false,
      statusText: 'Completed',
      fullFormatted: formatTaskDate(dueDate, dueTime),
      badgeType: 'completed',
    };
  }

  if (!dueDate) {
    return {
      isOverdue: false,
      statusText: '',
      fullFormatted: '',
      badgeType: 'none',
    };
  }

  const parsed = parseTaskDateTime(dueDate, dueTime);
  if (!parsed || isNaN(parsed.date.getTime())) {
    return { isOverdue: false, statusText: '', fullFormatted: '', badgeType: 'none' };
  }

  const now = new Date();
  const targetDate = parsed.date;
  const todayStart = startOfDay(now);
  const targetDayStart = startOfDay(targetDate);

  const diffCalendarDays = differenceInCalendarDays(targetDayStart, todayStart);
  const fullFormatted = formatTaskDate(dueDate, dueTime);
  const timeFormatted = dueTime ? format12HourTime(dueTime) : '';

  // Task has specific due time
  if (parsed.hasTime) {
    const diffMins = differenceInMinutes(targetDate, now);
    const diffHrs = differenceInHours(targetDate, now);

    // Past due (overdue)
    if (diffMins < 0) {
      const overdueDays = Math.abs(diffCalendarDays);
      if (diffCalendarDays < 0) {
        // Due on a previous day
        const dayText = overdueDays === 1 ? '1 day' : `${overdueDays} days`;
        return {
          isOverdue: true,
          statusText: `Overdue by ${dayText}`,
          fullFormatted,
          badgeType: 'overdue',
        };
      }

      // Overdue today
      const overdueHrs = Math.abs(diffHrs);
      if (overdueHrs >= 1) {
        const hrText = overdueHrs === 1 ? '1 hour' : `${overdueHrs} hours`;
        return {
          isOverdue: true,
          statusText: `Overdue by ${hrText}`,
          fullFormatted,
          badgeType: 'overdue',
        };
      }

      const overdueMins = Math.max(1, Math.abs(diffMins));
      return {
        isOverdue: true,
        statusText: `Overdue by ${overdueMins}m`,
        fullFormatted,
        badgeType: 'overdue',
      };
    }

    // Due today in the future
    if (diffCalendarDays === 0) {
      if (diffHrs >= 1 && diffHrs <= 6) {
        const hrText = diffHrs === 1 ? '1 hour' : `${diffHrs} hours`;
        return {
          isOverdue: false,
          statusText: `Due in ${hrText}`,
          fullFormatted,
          badgeType: 'urgent',
        };
      }
      if (diffHrs < 1 && diffMins > 0) {
        return {
          isOverdue: false,
          statusText: `Due in ${diffMins}m`,
          fullFormatted,
          badgeType: 'urgent',
        };
      }
      return {
        isOverdue: false,
        statusText: `Due Today • ${timeFormatted}`,
        fullFormatted,
        badgeType: 'today',
      };
    }

    // Due tomorrow
    if (diffCalendarDays === 1) {
      return {
        isOverdue: false,
        statusText: 'Due Tomorrow',
        fullFormatted,
        badgeType: 'upcoming',
      };
    }

    // Further in the future
    return {
      isOverdue: false,
      statusText: formatTaskDate(dueDate, dueTime),
      fullFormatted,
      badgeType: 'upcoming',
    };
  }

  // Task does NOT have specific time (only date)
  if (diffCalendarDays < 0) {
    const overdueDays = Math.abs(diffCalendarDays);
    const dayText = overdueDays === 1 ? '1 day' : `${overdueDays} days`;
    return {
      isOverdue: true,
      statusText: `Overdue by ${dayText}`,
      fullFormatted,
      badgeType: 'overdue',
    };
  }

  if (diffCalendarDays === 0) {
    return {
      isOverdue: false,
      statusText: 'Due Today',
      fullFormatted,
      badgeType: 'today',
    };
  }

  if (diffCalendarDays === 1) {
    return {
      isOverdue: false,
      statusText: 'Due Tomorrow',
      fullFormatted,
      badgeType: 'upcoming',
    };
  }

  return {
    isOverdue: false,
    statusText: formatTaskDate(dueDate, null),
    fullFormatted,
    badgeType: 'upcoming',
  };
}

/**
 * Formats header live clock into:
 * {
 *   dateText: "Tuesday, Sep 8",
 *   timeText: "1:42 PM"
 * }
 */
export function formatHeaderClock(date = new Date()) {
  const dateText = format(date, 'EEEE, MMM d');
  const timeText = format(date, 'h:mm a');
  return { dateText, timeText };
}

/**
 * Calculates the next occurrence date for recurring tasks.
 * @param {string} dueDateStr - YYYY-MM-DD
 * @param {'daily'|'weekdays'|'weekly'|'monthly'|'none'} recurrence
 * @returns {string|null} YYYY-MM-DD
 */
export function getNextRecurrenceDate(dueDateStr, recurrence) {
  if (!dueDateStr || !recurrence || recurrence === 'none') return null;
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);

  if (recurrence === 'daily') {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (recurrence === 'weekdays') {
    const dayOfWeek = baseDate.getDay(); // 0: Sun, 5: Fri, 6: Sat
    if (dayOfWeek === 5) {
      baseDate.setDate(baseDate.getDate() + 3); // Fri -> Mon
    } else if (dayOfWeek === 6) {
      baseDate.setDate(baseDate.getDate() + 2); // Sat -> Mon
    } else {
      baseDate.setDate(baseDate.getDate() + 1);
    }
  } else if (recurrence === 'weekly') {
    baseDate.setDate(baseDate.getDate() + 7);
  } else if (recurrence === 'monthly') {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }

  return getLocalDateString(baseDate);
}

/**
 * Checks if a YYYY-MM-DD string is tomorrow.
 */
export function isDateTomorrow(dateStr) {
  if (!dateStr) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow) === dateStr;
}

/**
 * Checks if a YYYY-MM-DD string is within the next 7 days.
 */
export function isDateThisWeek(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);

  const todayStr = getLocalDateString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const today = new Date(ty, tm - 1, td);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

/**
 * Checks if a YYYY-MM-DD string is after today.
 */
export function isDateUpcoming(dateStr) {
  if (!dateStr) return false;
  const todayStr = getLocalDateString();
  return dateStr > todayStr;
}

