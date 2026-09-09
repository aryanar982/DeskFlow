import { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { playChime, showNotification } from '../services/notifications';
import {
  getLocalDateString,
  getDueStatus,
  getNextRecurrenceDate,
  isDateTomorrow,
  isDateThisWeek,
  isDateUpcoming,
} from '../utils/dateUtils';

export function useTasks(soundEnabled = true) {
  const [tasks, setTasks] = useState(() => {
    const raw = storage.getTasks();
    return raw.map((t) => ({
      ...t,
      category: t.category?.toLowerCase() === 'general' ? '' : (t.category || ''),
      tags: (t.tags || []).filter((tag) => tag && tag.toLowerCase() !== 'general'),
    }));
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'Work' | 'Personal' etc.
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    storage.setTasks(tasks);
  }, [tasks]);

  const addTask = (taskData) => {
    const dueDate = taskData.dueDate || getLocalDateString();
    const dueTime = taskData.dueTime || '12:00';
    const rawTags = taskData.tags || (taskData.tag ? [taskData.tag] : []);
    const tags = (Array.isArray(rawTags) ? rawTags : [rawTags])
      .map((t) => t.trim())
      .filter((t) => t && t.toLowerCase() !== 'general');
    const category = taskData.category?.toLowerCase() === 'general' ? '' : (taskData.category || '');

    const newTask = {
      id: 't-' + Date.now(),
      title: (taskData.title || '').trim(),
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      category,
      tags,
      color: taskData.color || 'none',
      pinned: Boolean(taskData.pinned),
      archived: false,
      dueDate,
      dueTime,
      dueDateTime: taskData.dueDateTime || `${dueDate}T${dueTime}:00`,
      recurrence: taskData.recurrence || 'none',
      subtasks: Array.isArray(taskData.subtasks)
        ? taskData.subtasks.map((st, i) => ({
            id: st.id || `st-${Date.now()}-${i}`,
            title: st.title.trim(),
            completed: Boolean(st.completed),
          }))
        : [],
      attachments: Array.isArray(taskData.attachments) ? taskData.attachments : [],
      completed: false,
      completedAt: null,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev.map((t) => ({ ...t, order: (t.order ?? 0) + 1 }))]);
    return newTask;
  };

  const updateTask = (id, updates) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: Date.now(),
            }
          : t
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePinTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t))
    );
  };

  const toggleArchiveTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, archived: !t.archived } : t))
    );
  };

  const duplicateTask = (id) => {
    const original = tasks.find((t) => t.id === id);
    if (!original) return;

    const cloned = {
      ...original,
      id: 't-' + Date.now(),
      title: `${original.title} (Copy)`,
      completed: false,
      completedAt: null,
      subtasks: (original.subtasks || []).map((st, idx) => ({
        ...st,
        id: `st-dup-${Date.now()}-${idx}`,
        completed: false,
      })),
      order: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setTasks((prev) => [cloned, ...prev]);
    showNotification('Task Duplicated', `Created copy of "${original.title}"`);
  };

  const toggleComplete = (id) => {
    setTasks((prev) => {
      let recurringToSpawn = null;

      const next = prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          if (nextCompleted) {
            if (soundEnabled) playChime('complete');

            // Check if recurring task should spawn next occurrence
            if (t.recurrence && t.recurrence !== 'none' && t.dueDate) {
              const nextDate = getNextRecurrenceDate(t.dueDate, t.recurrence);
              if (nextDate) {
                recurringToSpawn = {
                  ...t,
                  id: 't-' + Date.now() + '-rec',
                  dueDate: nextDate,
                  dueDateTime: `${nextDate}T${t.dueTime || '12:00'}:00`,
                  completed: false,
                  completedAt: null,
                  subtasks: (t.subtasks || []).map((st, i) => ({
                    ...st,
                    id: `st-rec-${Date.now()}-${i}`,
                    completed: false,
                  })),
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
              }
            }
          }
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : null,
          };
        }
        return t;
      });

      if (recurringToSpawn) {
        showNotification(
          'Recurring Task Rescheduled 🔄',
          `Next occurrence for "${recurringToSpawn.title}" is scheduled for ${recurringToSpawn.dueDate}.`
        );
        return [recurringToSpawn, ...next];
      }

      return next;
    });
  };

  // Subtask Management
  const addSubtask = (taskId, title) => {
    if (!title.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newSubtask = {
            id: `st-${Date.now()}-${(t.subtasks || []).length}`,
            title: title.trim(),
            completed: false,
          };
          return {
            ...t,
            subtasks: [...(t.subtasks || []), newSubtask],
            updatedAt: Date.now(),
          };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = (t.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return {
            ...t,
            subtasks: updatedSubtasks,
            updatedAt: Date.now(),
          };
        }
        return t;
      })
    );
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId),
            updatedAt: Date.now(),
          };
        }
        return t;
      })
    );
  };

  // Drag and Drop reordering
  const reorderTasks = (sourceId, destinationId) => {
    if (sourceId === destinationId) return;

    setTasks((prev) => {
      const cloned = [...prev];
      const sourceIndex = cloned.findIndex((t) => t.id === sourceId);
      const destIndex = cloned.findIndex((t) => t.id === destinationId);

      if (sourceIndex === -1 || destIndex === -1) return prev;

      const [removed] = cloned.splice(sourceIndex, 1);
      cloned.splice(destIndex, 0, removed);

      return cloned.map((t, idx) => ({ ...t, order: idx }));
    });
  };

  // Bulk Operations
  const bulkComplete = (taskIds, completed = true) => {
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? {
              ...t,
              completed,
              completedAt: completed ? Date.now() : null,
              updatedAt: Date.now(),
            }
          : t
      )
    );
    if (soundEnabled && completed) playChime('complete');
  };

  const bulkDelete = (taskIds) => {
    setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
  };

  const bulkArchive = (taskIds, archived = true) => {
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? { ...t, archived, updatedAt: Date.now() }
          : t
      )
    );
  };

  const bulkSetPriority = (taskIds, priority) => {
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? { ...t, priority, updatedAt: Date.now() }
          : t
      )
    );
  };

  const bulkSetDueDate = (taskIds, dueDate) => {
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id)
          ? {
              ...t,
              dueDate,
              dueDateTime: `${dueDate}T${t.dueTime || '12:00'}:00`,
              updatedAt: Date.now(),
            }
          : t
      )
    );
  };

  const todayStr = getLocalDateString();

  // Smart Search parsing & multi-criteria filtering
  const filteredTasks = useMemo(() => {
    // Parse smart query tokens
    const rawTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const tagTokens = [];
    const catTokens = [];
    const priorityTokens = [];
    let dueToken = null;
    const textTokens = [];

    rawTokens.forEach((token) => {
      if (token.startsWith('#')) {
        tagTokens.push(token.slice(1));
      } else if (token.startsWith('@') || token.startsWith('cat:')) {
        catTokens.push(token.replace(/^(@|cat:)/, ''));
      } else if (token.startsWith('!') || token.startsWith('p:')) {
        priorityTokens.push(token.replace(/^(!|p:)/, ''));
      } else if (token.startsWith('due:')) {
        dueToken = token.replace('due:', '');
      } else {
        textTokens.push(token);
      }
    });

    return tasks
      .filter((task) => {
        // 1. Archive filter separation
        if (filter === 'archived') {
          return task.archived === true;
        }
        // Non-archived views hide archived tasks
        if (task.archived) return false;

        // When "All" is selected and no search query, show all active tasks
        if (filter === 'all' && rawTokens.length === 0) {
          return true;
        }

        // 2. Category filter (when active and not 'all')
        if (filter !== 'all' && filter !== 'completed' && categoryFilter !== 'all' && task.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false;
        }

        // 4. View / Tab filter
        if (filter === 'today') {
          if (task.dueDate !== todayStr) return false;
        } else if (filter === 'upcoming') {
          if (!isDateUpcoming(task.dueDate)) return false;
        } else if (filter === 'tomorrow') {
          if (!isDateTomorrow(task.dueDate)) return false;
        } else if (filter === 'thisWeek') {
          if (!isDateThisWeek(task.dueDate)) return false;
        } else if (filter === 'overdue') {
          const status = getDueStatus(task.dueDate, task.dueTime, task.completed);
          if (!status.isOverdue || task.completed) return false;
        } else if (filter === 'highPriority') {
          const p = task.priority?.toLowerCase();
          if (p !== 'urgent' && p !== 'high') return false;
        } else if (filter === 'completed') {
          if (!task.completed) return false;
        }

        // 5. Smart Search Omnibox Filter
        if (tagTokens.length > 0) {
          const taskTags = (task.tags || []).map((t) => t.toLowerCase());
          const hasTag = tagTokens.some((tag) => taskTags.some((t) => t.includes(tag)));
          if (!hasTag) return false;
        }

        if (catTokens.length > 0) {
          const taskCat = (task.category || '').toLowerCase();
          const hasCat = catTokens.some((cat) => taskCat.includes(cat));
          if (!hasCat) return false;
        }

        if (priorityTokens.length > 0) {
          const taskPriority = (task.priority || '').toLowerCase();
          const hasPriority = priorityTokens.some((p) => taskPriority.includes(p));
          if (!hasPriority) return false;
        }

        if (dueToken) {
          if (dueToken === 'today' && task.dueDate !== todayStr) return false;
          if (dueToken === 'tomorrow' && !isDateTomorrow(task.dueDate)) return false;
          if (dueToken === 'upcoming' && !isDateUpcoming(task.dueDate)) return false;
          if (dueToken === 'overdue' && !getDueStatus(task.dueDate, task.dueTime, task.completed).isOverdue) return false;
          if (dueToken === 'week' && !isDateThisWeek(task.dueDate)) return false;
        }

        if (textTokens.length > 0) {
          const textToSearch = `${task.title} ${task.description || ''} ${(task.tags || []).join(' ')} ${(task.subtasks || []).map((s) => s.title).join(' ')}`.toLowerCase();
          const matchAll = textTokens.every((token) => textToSearch.includes(token));
          if (!matchAll) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned tasks float to top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        // Maintain custom drag-and-drop order
        const orderA = typeof a.order === 'number' ? a.order : 9999;
        const orderB = typeof b.order === 'number' ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;

        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [tasks, searchQuery, filter, categoryFilter, selectedDate, todayStr]);

  // Statistics calculation across all active tasks
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => !t.archived);
    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const todayTasks = activeTasks.filter((t) => t.dueDate === todayStr);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    const upcomingTasks = activeTasks.filter((t) => isDateUpcoming(t.dueDate));
    const tomorrowTasks = activeTasks.filter((t) => isDateTomorrow(t.dueDate));
    const thisWeekTasks = activeTasks.filter((t) => isDateThisWeek(t.dueDate));

    const overdue = activeTasks.filter(
      (t) => !t.completed && getDueStatus(t.dueDate, t.dueTime, false).isOverdue
    );

    const highPriority = activeTasks.filter((t) => {
      const p = t.priority?.toLowerCase();
      return (p === 'urgent' || p === 'high') && !t.completed;
    });

    const archivedCount = tasks.filter((t) => t.archived).length;

    return {
      total,
      completed,
      percentage,
      todayTotal: todayTasks.length,
      todayCompleted,
      upcomingTotal: upcomingTasks.length,
      tomorrowTotal: tomorrowTasks.length,
      thisWeekTotal: thisWeekTasks.length,
      overdueCount: overdue.length,
      highPriorityCount: highPriority.length,
      archivedCount,
    };
  }, [tasks, todayStr]);

  return {
    tasks,
    filteredTasks,
    stats,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    selectedDate,
    setSelectedDate,
    addTask,
    updateTask,
    deleteTask,
    togglePinTask,
    toggleArchiveTask,
    duplicateTask,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    reorderTasks,
    bulkComplete,
    bulkDelete,
    bulkArchive,
    bulkSetPriority,
    bulkSetDueDate,
    reloadTasks: (customTasks) => setTasks(customTasks || storage.getTasks()),
  };
}
