import React, { useState } from 'react';
import { Domain, RecurringTemplate, Priority } from '../types';
import { templateFiresOnWeekday } from '../utils/date';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarPanelProps {
  domains: Domain[];
  recurring: RecurringTemplate[];
  todayStr: string;
  onJumpToTask: (taskId: string) => void;
  onClose: () => void;
}

interface CalendarItem {
  taskId: string;
  taskName: string;
  domainName: string;
  subtaskId?: string;
  subtaskName?: string;
  priority: Priority;
  kind: 'task' | 'subtask';
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  domains,
  recurring,
  todayStr,
  onJumpToTask,
  onClose,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const ref = new Date(todayStr + 'T00:00:00');
    return new Date(ref.getFullYear(), ref.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun..6=Sat

  // Build calendar task index
  const calendarIndex: Record<string, { taskIds: Set<string>; items: CalendarItem[] }> = {};

  domains.forEach(d => {
    d.tasks.forEach(t => {
      if (t.status === 'done') return;

      if (t.subtasks.length === 0 && t.deadline) {
        if (!calendarIndex[t.deadline]) {
          calendarIndex[t.deadline] = { taskIds: new Set(), items: [] };
        }
        calendarIndex[t.deadline].taskIds.add(t.id);
        calendarIndex[t.deadline].items.push({
          taskId: t.id,
          taskName: t.name,
          domainName: d.name,
          priority: t.priority,
          kind: 'task',
        });
      }

      t.subtasks.forEach(s => {
        if (s.done || !s.deadline) return;
        if (!calendarIndex[s.deadline]) {
          calendarIndex[s.deadline] = { taskIds: new Set(), items: [] };
        }
        calendarIndex[s.deadline].taskIds.add(t.id);
        calendarIndex[s.deadline].items.push({
          taskId: t.id,
          taskName: t.name,
          domainName: d.name,
          subtaskId: s.id,
          subtaskName: s.name,
          priority: s.priority,
          kind: 'subtask',
        });
      });
    });
  });

  // Ghost recurring projections for future days strictly > todayStr
  const getGhostsForDate = (dateStr: string): RecurringTemplate[] => {
    if (!todayStr || dateStr <= todayStr) return [];
    const [y, m, d] = dateStr.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    return recurring.filter(r => templateFiresOnWeekday(r, weekday));
  };

  const shiftMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const goToday = () => {
    const ref = new Date(todayStr + 'T00:00:00');
    setCurrentDate(new Date(ref.getFullYear(), ref.getMonth(), 1));
    setSelectedDate(todayStr);
  };

  const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Detail item list for selected day
  const selectedInfo = selectedDate ? calendarIndex[selectedDate] : null;
  const selectedGhosts = selectedDate ? getGhostsForDate(selectedDate) : [];
  const selectedLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="bg-[#FBFAF7] border-[1.5px] border-[#10202B] rounded-[14px] p-3 sm:p-4 mb-4 shadow-md animate-[fadeUp_0.25s_ease-out]">
      {/* Navigation header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            title="Previous month"
            className="w-7 h-7 rounded border border-[#DCD6C7] hover:border-[#10202B] flex items-center justify-center text-[#10202B] active:scale-90 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="font-mono-code text-[11px] px-2 py-0.5 rounded border border-[#10202B] hover:bg-[#F1EEE6] font-semibold text-[#10202B]"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            title="Next month"
            className="w-7 h-7 rounded border border-[#DCD6C7] hover:border-[#10202B] flex items-center justify-center text-[#10202B] active:scale-90 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-disp font-bold text-[15px] sm:text-[16px] text-[#10202B]">
          {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>

        <button
          type="button"
          onClick={onClose}
          title="Close calendar"
          className="w-7 h-7 rounded border border-[#DCD6C7] hover:border-[#10202B] flex items-center justify-center text-[#5B6670] hover:text-[#10202B]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mt-2 text-center font-mono-code text-[9px] sm:text-[10px] text-[#5B6670] font-semibold uppercase">
        {weekdayHeaders.map(w => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-1">
        {/* Leading empty cells */}
        {Array.from({ length: startWeekday }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square opacity-0 pointer-events-none" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const info = calendarIndex[dateStr];
          const ghosts = getGhostsForDate(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasContent = Boolean(info || ghosts.length > 0);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(prev => (prev === dateStr ? null : dateStr))}
              className={`aspect-square p-1 rounded-md text-left flex flex-col justify-between border transition-all active:scale-95 ${
                isToday
                  ? 'bg-[#10202B] text-[#FBFAF7] border-[#10202B] font-bold shadow-sm'
                  : isSelected
                  ? 'bg-[#F1EEE6] border-[#2A7F73] ring-1 ring-[#2A7F73]'
                  : hasContent
                  ? 'bg-white border-[#DCD6C7] hover:border-[#10202B] text-[#10202B]'
                  : 'bg-[#F1EEE6]/60 border-transparent text-[#5B6670]'
              }`}
            >
              <span className="font-mono-code text-[10px] sm:text-[11px] leading-tight">
                {day}
              </span>

              {/* Task badges & ghost recurring dot */}
              <div className="w-full truncate text-[7.5px] sm:text-[8px] font-mono-code leading-none">
                {info && (
                  <span className={`${isToday ? 'text-[#D9A017]' : 'text-[#1F3A52]'} font-bold block truncate`}>
                    {info.taskIds.size}t·{info.items.length}i
                  </span>
                )}
                {ghosts.length > 0 && (
                  <span className={`${isToday ? 'text-[#EAE6DC]' : 'text-[#2A7F73]'} font-semibold block truncate cal-ghost-pulse`}>
                    +{ghosts.length}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2.5 text-[9px] font-mono-code text-[#5B6670] flex items-center justify-between border-t border-dashed border-[#DCD6C7] pt-2">
        <span>Solid = tasks/subtasks due</span>
        <span className="text-[#2A7F73] font-semibold">+N = projected recurring</span>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="mt-3 pt-2.5 border-t border-[#DCD6C7]">
          <div className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-[#10202B] mb-2 flex items-center justify-between">
            <span>{selectedLabel}</span>
            {selectedInfo && (
              <span className="text-[10px] text-[#5B6670] font-normal lowercase">
                {selectedInfo.taskIds.size} task{selectedInfo.taskIds.size === 1 ? '' : 's'}, {selectedInfo.items.length} item{selectedInfo.items.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {!selectedInfo && selectedGhosts.length === 0 ? (
            <div className="text-[12px] text-[#5B6670] py-2 italic">
              Nothing due on this date.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {/* Scheduled real items */}
              {selectedInfo?.items.map((it, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onJumpToTask(it.taskId)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#F1EEE6] hover:bg-[#EAE6DC] text-left text-[12px] transition-colors"
                >
                  <span className={`prio-dot ${it.priority}`} />
                  <span className="font-medium text-[#10202B] truncate flex-1">
                    {it.kind === 'subtask' ? it.subtaskName : it.taskName}
                  </span>
                  <span className="font-mono-code text-[10px] text-[#5B6670] shrink-0">
                    {it.domainName}
                    {it.kind === 'subtask' && ` › ${it.taskName}`}
                  </span>
                </button>
              ))}

              {/* Ghost projected recurring items */}
              {selectedGhosts.length > 0 && (
                <div className="pt-2">
                  <div className="text-[9.5px] font-mono-code uppercase text-[#2A7F73] font-bold mb-1">
                    Projected from recurring templates:
                  </div>
                  {selectedGhosts.map(g => (
                    <div
                      key={g.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg border border-dashed border-[#2A7F73]/40 bg-[#F1EEE6]/60 text-[11.5px] text-[#5B6670] italic"
                    >
                      <span className={`prio-dot ${g.priority}`} />
                      <span className="truncate flex-1">{g.name}</span>
                      <span className="font-mono-code text-[9px] text-[#2A7F73] uppercase">Auto-generates</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
