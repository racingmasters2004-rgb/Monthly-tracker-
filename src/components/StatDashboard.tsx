import React, { useState } from 'react';
import { Domain, Task, Subtask } from '../types';
import { domainScore } from '../utils/date';
import { CheckCircle2, ListTodo, AlertTriangle, TrendingUp, ChevronDown } from 'lucide-react';

interface StatDashboardProps {
  domains: Domain[];
  todayStr: string;
  onJumpToTask: (taskId: string) => void;
}

type PanelKey = 'completed' | 'open' | 'stalled' | 'progress' | null;

export const StatDashboard: React.FC<StatDashboardProps> = ({
  domains,
  todayStr,
  onJumpToTask,
}) => {
  const [activePanel, setActivePanel] = useState<PanelKey>(null);

  // Compute stat metrics
  let openTasksCount = 0;
  let stalledCount = 0;
  const openTasksList: Array<{ id: string; name: string; domainName: string }> = [];
  const stalledList: Array<{ id: string; name: string; domainName: string }> = [];
  const completedTodayList: Array<{ id: string; name: string; domainName: string; taskName?: string }> = [];

  const scores: number[] = [];

  domains.forEach(d => {
    const score = domainScore(d.tasks);
    if (score !== null) {
      scores.push(score);
    }

    d.tasks.forEach(t => {
      if (t.status !== 'done') {
        openTasksCount++;
        openTasksList.push({ id: t.id, name: t.name, domainName: d.name });
      }
      if (t.idle) {
        stalledCount++;
        stalledList.push({ id: t.id, name: t.name, domainName: d.name });
      }

      // Completed today subtasks
      t.subtasks.forEach(s => {
        if (s.done && s.completed_at && s.completed_at.slice(0, 10) === todayStr) {
          completedTodayList.push({
            id: t.id,
            name: s.name,
            domainName: d.name,
            taskName: t.name,
          });
        }
      });

      // Standalone tasks completed today
      if (t.subtasks.length === 0 && t.status === 'done' && t.completed_at && t.completed_at.slice(0, 10) === todayStr) {
        completedTodayList.push({
          id: t.id,
          name: t.name,
          domainName: d.name,
        });
      }
    });
  });

  const overallProgress = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const togglePanel = (key: PanelKey) => {
    setActivePanel(prev => (prev === key ? null : key));
  };

  const formattedDate = new Date(todayStr + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase();

  return (
    <section className="bg-[#FBFAF7] border-[1.5px] border-[#10202B] rounded-[14px] p-3.5 sm:p-4 mb-3.5 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-code text-[10px] sm:text-[11px] tracking-wider text-[#5B6670] uppercase font-medium">
          {formattedDate} • DAILY REPORT
        </span>
        {activePanel && (
          <button
            onClick={() => setActivePanel(null)}
            className="text-[10px] font-mono-code text-[#2A7F73] hover:underline flex items-center gap-0.5"
          >
            <span>Close detail</span>
            <ChevronDown className="w-3 h-3 rotate-180" />
          </button>
        )}
      </div>

      {/* 2x2 clickable stat grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {/* Tile 1: Completed today */}
        <button
          type="button"
          onClick={() => togglePanel('completed')}
          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-[10px] border-[1.5px] text-left transition-all active:scale-[0.98] ${
            activePanel === 'completed'
              ? 'bg-[#10202B] border-[#10202B] text-[#FBFAF7] shadow-sm'
              : 'bg-[#F1EEE6] border-[#DCD6C7] hover:border-[#10202B] text-[#10202B]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-disp text-[24px] sm:text-[28px] font-bold leading-none">
              {completedTodayList.length}
            </span>
            <CheckCircle2 className={`w-4 h-4 ${activePanel === 'completed' ? 'text-[#2A7F73]' : 'text-[#4C8557]'}`} />
          </div>
          <span className={`font-mono-code text-[9.5px] sm:text-[10px] uppercase tracking-wider mt-1.5 ${
            activePanel === 'completed' ? 'text-[#E6E1D5]' : 'text-[#5B6670]'
          }`}>
            Completed today
          </span>
        </button>

        {/* Tile 2: Open tasks */}
        <button
          type="button"
          onClick={() => togglePanel('open')}
          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-[10px] border-[1.5px] text-left transition-all active:scale-[0.98] ${
            activePanel === 'open'
              ? 'bg-[#10202B] border-[#10202B] text-[#FBFAF7] shadow-sm'
              : 'bg-[#F1EEE6] border-[#DCD6C7] hover:border-[#10202B] text-[#10202B]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-disp text-[24px] sm:text-[28px] font-bold leading-none">
              {openTasksCount}
            </span>
            <ListTodo className={`w-4 h-4 ${activePanel === 'open' ? 'text-[#2A6FA3]' : 'text-[#1F3A52]'}`} />
          </div>
          <span className={`font-mono-code text-[9.5px] sm:text-[10px] uppercase tracking-wider mt-1.5 ${
            activePanel === 'open' ? 'text-[#E6E1D5]' : 'text-[#5B6670]'
          }`}>
            Open tasks
          </span>
        </button>

        {/* Tile 3: Stalled */}
        <button
          type="button"
          onClick={() => togglePanel('stalled')}
          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-[10px] border-[1.5px] text-left transition-all active:scale-[0.98] ${
            activePanel === 'stalled'
              ? 'bg-[#10202B] border-[#10202B] text-[#FBFAF7] shadow-sm'
              : 'bg-[#F1EEE6] border-[#DCD6C7] hover:border-[#10202B] text-[#10202B]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`font-disp text-[24px] sm:text-[28px] font-bold leading-none ${
              stalledCount > 0 && activePanel !== 'stalled' ? 'text-[#C4331E]' : ''
            }`}>
              {stalledCount}
            </span>
            <AlertTriangle className={`w-4 h-4 ${stalledCount > 0 ? 'text-[#C4331E]' : 'text-[#5B6670]'}`} />
          </div>
          <span className={`font-mono-code text-[9.5px] sm:text-[10px] uppercase tracking-wider mt-1.5 ${
            activePanel === 'stalled' ? 'text-[#E6E1D5]' : 'text-[#5B6670]'
          }`}>
            Stalled
          </span>
        </button>

        {/* Tile 4: Overall progress */}
        <button
          type="button"
          onClick={() => togglePanel('progress')}
          className={`flex flex-col items-start p-2.5 sm:p-3 rounded-[10px] border-[1.5px] text-left transition-all active:scale-[0.98] ${
            activePanel === 'progress'
              ? 'bg-[#10202B] border-[#10202B] text-[#FBFAF7] shadow-sm'
              : 'bg-[#F1EEE6] border-[#DCD6C7] hover:border-[#10202B] text-[#10202B]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-disp text-[24px] sm:text-[28px] font-bold leading-none text-[#2A7F73]">
              {overallProgress === null ? '--' : `${overallProgress}%`}
            </span>
            <TrendingUp className={`w-4 h-4 ${activePanel === 'progress' ? 'text-[#2A7F73]' : 'text-[#2A7F73]'}`} />
          </div>
          <span className={`font-mono-code text-[9.5px] sm:text-[10px] uppercase tracking-wider mt-1.5 ${
            activePanel === 'progress' ? 'text-[#E6E1D5]' : 'text-[#5B6670]'
          }`}>
            Overall progress
          </span>
        </button>
      </div>

      {/* Expandable detail panel */}
      {activePanel && (
        <div className="mt-3 pt-3 border-t border-dashed border-[#DCD6C7] text-left animate-[fadeUp_0.2s_ease-out]">
          {activePanel === 'completed' && (
            <div>
              <div className="text-[11px] font-mono-code font-bold text-[#10202B] mb-2 uppercase">
                Completed Today ({completedTodayList.length})
              </div>
              {completedTodayList.length === 0 ? (
                <div className="text-[12px] text-[#5B6670] py-2 italic">
                  Nothing completed yet today. Check off a subtask to start your momentum!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {completedTodayList.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onJumpToTask(item.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[#F1EEE6] hover:bg-[#EAE6DC] text-left text-[12px] transition-colors"
                    >
                      <span className="font-medium text-[#10202B] truncate mr-2">
                        {item.name}
                      </span>
                      <span className="font-mono-code text-[10px] text-[#5B6670] shrink-0">
                        {item.domainName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePanel === 'open' && (
            <div>
              <div className="text-[11px] font-mono-code font-bold text-[#10202B] mb-2 uppercase">
                Open Tasks ({openTasksList.length})
              </div>
              {openTasksList.length === 0 ? (
                <div className="text-[12px] text-[#2A7F73] py-2 font-medium">
                  🎉 Fantastic! No open tasks remaining.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {openTasksList.map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onJumpToTask(task.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[#F1EEE6] hover:bg-[#EAE6DC] text-left text-[12px] transition-colors"
                    >
                      <span className="font-medium text-[#10202B] truncate mr-2">
                        {task.name}
                      </span>
                      <span className="font-mono-code text-[10px] text-[#5B6670] shrink-0">
                        {task.domainName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePanel === 'stalled' && (
            <div>
              <div className="text-[11px] font-mono-code font-bold text-[#C4331E] mb-2 uppercase">
                Stalled Tasks ({stalledList.length})
              </div>
              {stalledList.length === 0 ? (
                <div className="text-[12px] text-[#4C8557] py-2">
                  No tasks stalled. Steady progress across all domains!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {stalledList.map(task => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onJumpToTask(task.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-[#FDECEA] border border-[#FBD3CD] hover:bg-[#FCDFD9] text-left text-[12px] transition-colors"
                    >
                      <span className="font-medium text-[#C4331E] truncate mr-2">
                        {task.name}
                      </span>
                      <span className="font-mono-code text-[10px] text-[#C4331E] shrink-0 underline">
                        Jump to task →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activePanel === 'progress' && (
            <div>
              <div className="text-[11px] font-mono-code font-bold text-[#10202B] mb-2 uppercase">
                Domain Breakdown
              </div>
              <div className="space-y-2">
                {domains.map(d => {
                  const s = domainScore(d.tasks);
                  return (
                    <div key={d.id} className="flex items-center justify-between text-[12px]">
                      <span className="text-[#10202B] font-medium truncate mr-2">
                        {d.name}
                      </span>
                      <span className="font-mono-code text-[11px] font-semibold text-[#2A7F73] shrink-0">
                        {s === null ? 'no items' : `${s}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
