/**
 * Timezone-aware date calculations, priority weighting, domain score,
 * idle detection, Eisenhower matrix, and streak calculators.
 */

import { Priority, EisenhowerQuadrant, FilterView, Domain, Task, Subtask, RecurringTemplate, WeeklyReview } from '../types';

/**
 * Returns YYYY-MM-DD string for a given date in the specified IANA timezone.
 * Defaults to 'Asia/Kolkata'.
 */
export function getZonedDateString(date: Date = new Date(), timezone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback to local ISO date string if timezone is invalid
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Weight assigned to task/subtask priorities:
 * High = 2.0, Medium = 1.5, Low = 1.0
 */
export function priorityWeight(priority: Priority): number {
  switch (priority) {
    case 'high': return 2.0;
    case 'medium': return 1.5;
    default: return 1.0;
  }
}

/**
 * Tags are always stored upper-case and de-duplicated.
 */
export function normalizeTags(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return Array.from(new Set(input.map(t => t.trim().toUpperCase()).filter(Boolean)));
  }
  const parts = input.split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  return Array.from(new Set(parts));
}

/**
 * Eisenhower quadrant from important/urgent flags.
 */
export function eisenhowerQuadrant(important: boolean, urgent: boolean): EisenhowerQuadrant {
  if (important && urgent) return { key: 'do', label: 'Do now' };
  if (important && !urgent) return { key: 'plan', label: 'Plan it' };
  if (!important && urgent) return { key: 'delegate', label: 'Delegate' };
  return { key: 'drop', label: 'Drop / later' };
}

/**
 * Deadline bucket relative to the authoritative server today date string.
 */
export function deadlineBucket(deadline: string | null | undefined, done: boolean, todayStr: string): FilterView | 'future' | 'none' {
  if (done) return 'done';
  if (!deadline) return 'none';

  const today = new Date(todayStr + 'T00:00:00');
  const d = new Date(deadline + 'T00:00:00');
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 7) return 'week';
  return 'future';
}

/**
 * Weighted domain score:
 * Σ(weight of done subtasks) / Σ(weight of all subtasks) * 100
 * Returns null if domain has no subtasks yet.
 */
export function domainScore(tasks: Task[]): number | null {
  let totalWeight = 0.0;
  let doneWeight = 0.0;

  tasks.forEach(t => {
    t.subtasks.forEach(s => {
      const w = priorityWeight(s.priority);
      totalWeight += w;
      if (s.done) {
        doneWeight += w;
      }
    });
  });

  if (totalWeight === 0) return null;
  return Math.round((doneWeight / totalWeight) * 1000) / 10;
}

/**
 * Idle task detection rule:
 * - not done
 * - has >= 1 open subtask
 * - created > 3 days ago from today
 * - no subtask completed in the last 3 days (or none ever)
 */
export function isTaskIdle(task: Task, todayStr: string): boolean {
  if (task.status === 'done') return false;
  const openSubtasks = task.subtasks.filter(s => !s.done);
  if (openSubtasks.length === 0) return false;

  const today = new Date(todayStr + 'T00:00:00');
  const createdAt = new Date(task.created_at || (todayStr + 'T00:00:00'));
  const ageDays = (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (ageDays < 3) return false; // Grace period for new tasks

  let lastActivity = createdAt;
  task.subtasks.forEach(s => {
    if (s.completed_at) {
      const c = new Date(s.completed_at);
      if (c.getTime() > lastActivity.getTime()) {
        lastActivity = c;
      }
    }
  });

  const idleDays = (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  return idleDays >= 3;
}

/**
 * Step back to previous scheduled weekday for a recurring template.
 */
function stepBackScheduledDate(template: RecurringTemplate, date: Date): Date {
  const next = new Date(date);
  if (template.frequency === 'daily' || template.weekdays.length === 7) {
    next.setDate(next.getDate() - 1);
    return next;
  }
  const days = template.weekdays.length ? template.weekdays : [0, 1, 2, 3, 4, 5, 6];
  for (let i = 0; i < 8; i++) {
    next.setDate(next.getDate() - 1);
    if (days.includes(next.getDay())) {
      return next;
    }
  }
  return next;
}

/**
 * Calculate habit streak:
 * Consecutive scheduled days completed stepping backward from today.
 * If today's instance is unfinished, it does NOT break the streak (starts from previous scheduled day).
 */
export function calculateStreak(template: RecurringTemplate, allSubtasks: Subtask[], allTasks: Task[], todayStr: string): number {
  const isSub = Boolean(template.task_id);
  const doneMap: Record<string, boolean> = {};

  if (isSub) {
    allSubtasks
      .filter(s => s.recurring_template_id === template.id && s.deadline)
      .forEach(s => {
        doneMap[s.deadline!] = s.done;
      });
  } else {
    allTasks
      .filter(t => t.recurring_template_id === template.id && t.deadline)
      .forEach(t => {
        doneMap[t.deadline!] = t.status === 'done';
      });
  }

  let cursor = new Date(todayStr + 'T00:00:00');
  const todayKey = todayStr;

  // If today is not done, start checking from the previous scheduled day
  if (!doneMap[todayKey]) {
    cursor = stepBackScheduledDate(template, cursor);
  }

  let streak = 0;
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (doneMap[key]) {
      streak++;
      cursor = stepBackScheduledDate(template, cursor);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check if a recurring template fires on a specific weekday (0=Sun..6=Sat).
 */
export function templateFiresOnWeekday(template: RecurringTemplate, weekday: number): boolean {
  if (!template.active) return false;
  if (template.frequency === 'daily' || template.weekdays.length === 7) return true;
  return template.weekdays.includes(weekday);
}

/**
 * Project ghost dots (+N) for active recurring templates on future calendar days strictly after today.
 */
export function getGhostRecurringCount(templates: RecurringTemplate[], dateStr: string, todayStr: string): number {
  if (!todayStr || dateStr <= todayStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return templates.filter(t => templateFiresOnWeekday(t, weekday)).length;
}

/**
 * Weekly Review: Mon-Sun range around reference date.
 * Planned vs Done per day and per domain.
 */
export function computeWeeklyReview(domains: Domain[], todayStr: string): WeeklyReview {
  const today = new Date(todayStr + 'T00:00:00');
  const dow = today.getDay(); // 0=Sun..6=Sat
  // ISO day of week: 1=Mon..7=Sun
  const isoDow = dow === 0 ? 7 : dow;

  const monday = new Date(today);
  monday.setDate(today.getDate() - (isoDow - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().slice(0, 10);
  const sundayStr = sunday.toISOString().slice(0, 10);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const by_day: Record<string, { planned: number; done: number }> = {};
  dayNames.forEach(d => {
    by_day[d] = { planned: 0, done: 0 };
  });

  const byDomainMap: Record<string, { id: string; name: string; planned: number; done: number }> = {};
  let totalPlanned = 0;
  let totalDone = 0;
  let weightedDone = 0.0;

  domains.forEach(domain => {
    byDomainMap[domain.id] = { id: domain.id, name: domain.name, planned: 0, done: 0 };

    domain.tasks.forEach(task => {
      // If task has subtasks, count each subtask due this week
      if (task.subtasks.length > 0) {
        task.subtasks.forEach(sub => {
          if (sub.deadline && sub.deadline >= mondayStr && sub.deadline <= sundayStr) {
            const subDate = new Date(sub.deadline + 'T00:00:00');
            const subDow = subDate.getDay() === 0 ? 6 : subDate.getDay() - 1;
            const dayName = dayNames[subDow];

            by_day[dayName].planned++;
            byDomainMap[domain.id].planned++;
            totalPlanned++;

            if (sub.done) {
              by_day[dayName].done++;
              byDomainMap[domain.id].done++;
              totalDone++;
              weightedDone += priorityWeight(sub.priority);
            }
          }
        });
      } else {
        // Standalone task with no subtasks
        if (task.deadline && task.deadline >= mondayStr && task.deadline <= sundayStr) {
          const taskDate = new Date(task.deadline + 'T00:00:00');
          const taskDow = taskDate.getDay() === 0 ? 6 : taskDate.getDay() - 1;
          const dayName = dayNames[taskDow];

          by_day[dayName].planned++;
          byDomainMap[domain.id].planned++;
          totalPlanned++;

          if (task.status === 'done') {
            by_day[dayName].done++;
            byDomainMap[domain.id].done++;
            totalDone++;
            weightedDone += priorityWeight(task.priority);
          }
        }
      }
    });
  });

  return {
    range: { start: mondayStr, end: sundayStr },
    total_planned: totalPlanned,
    total_done: totalDone,
    weighted_done: Math.round(weightedDone * 10) / 10,
    by_day,
    by_domain: Object.values(byDomainMap).filter(d => d.planned > 0),
  };
}

/**
 * Format currency with proper Indian numbering (1,00,000) or standard international numbering.
 */
export function formatCurrency(amount: number, currency: string = 'INR', symbol: string = '₹'): string {
  const isINR = currency === 'INR' || symbol === '₹';
  const formattedNumber = new Intl.NumberFormat(isINR ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formattedNumber}`;
}
