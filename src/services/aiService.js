export const aiService = {
  // Heuristic Smart Scheduler: organizes tasks into Morning, Afternoon, Evening
  generateSchedule: (tasks) => {
    const pendingTasks = tasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) {
      return {
        morning: [],
        afternoon: [],
        evening: [],
        summary: 'All caught up! No pending tasks remaining.',
        tip: 'Take time to recharge, plan for tomorrow, or explore new ideas.',
      };
    }

    // Sort by priority weight
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    const sorted = [...pendingTasks].sort((a, b) => {
      const wA = priorityWeights[a.priority] || 1;
      const wB = priorityWeights[b.priority] || 1;
      return wB - wA;
    });

    const morning = [];
    const afternoon = [];
    const evening = [];

    sorted.forEach((task) => {
      // If task has explicit time, bucket by time
      if (task.dueTime) {
        const hour = parseInt(task.dueTime.split(':')[0], 10);
        if (hour < 12) {
          morning.push(task);
          return;
        } else if (hour < 17) {
          afternoon.push(task);
          return;
        } else {
          evening.push(task);
          return;
        }
      }

      // Otherwise distribute by priority: urgent & high in morning/afternoon, low in evening
      if (task.priority === 'urgent' || (task.priority === 'high' && morning.length < 2)) {
        morning.push(task);
      } else if (afternoon.length <= morning.length) {
        afternoon.push(task);
      } else {
        evening.push(task);
      }
    });

    // Generate smart summary & productivity tip
    const urgentCount = pendingTasks.filter((t) => t.priority === 'urgent').length;
    const highCount = pendingTasks.filter((t) => t.priority === 'high').length;

    let summary = `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''}`;
    if (urgentCount > 0) {
      summary += ` with ${urgentCount} urgent item${urgentCount > 1 ? 's' : ''} requiring immediate focus.`;
    } else {
      summary += `. A well-balanced day ahead!`;
    }

    const tips = [
      'Tackle the most demanding cognitive tasks during your peak morning energy window.',
      'Use 25-minute Pomodoro focus sprints to power through high-priority items.',
      'Group similar quick tasks together to minimize context switching.',
      'Block 10 minutes at the end of the day to review what went well.',
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];

    return {
      morning,
      afternoon,
      evening,
      summary,
      tip,
    };
  },

  suggestPriority: (title) => {
    const lower = title.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('deadline') || lower.includes('bug') || lower.includes('crash')) {
      return 'urgent';
    }
    if (lower.includes('important') || lower.includes('client') || lower.includes('deploy') || lower.includes('presentation') || lower.includes('release')) {
      return 'high';
    }
    if (lower.includes('read') || lower.includes('explore') || lower.includes('someday') || lower.includes('cleanup')) {
      return 'low';
    }
    return 'medium';
  }
};
