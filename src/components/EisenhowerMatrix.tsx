import React from 'react';
import { Domain, Task } from '../types';
import { eisenhowerQuadrant } from '../utils/date';

interface EisenhowerMatrixProps {
  domains: Domain[];
  onJumpToTask: (taskId: string) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  domains,
  onJumpToTask,
}) => {
  const quadrants: Record<'do' | 'plan' | 'delegate' | 'drop', Task[]> = {
    do: [],
    plan: [],
    delegate: [],
    drop: [],
  };

  domains.forEach(d => {
    d.tasks.forEach(t => {
      if (t.status !== 'done') {
        const quad = eisenhowerQuadrant(t.important, t.urgent);
        quadrants[quad.key].push(t);
      }
    });
  });

  const quadConfig = [
    {
      key: 'do' as const,
      title: 'Do Now',
      subtitle: 'Important & Urgent',
      bg: 'bg-[#FBE4E0]',
      headerColor: 'text-[#C4331E]',
      border: 'border-[#FBD3CD]',
    },
    {
      key: 'plan' as const,
      title: 'Plan It',
      subtitle: 'Important, Not Urgent',
      bg: 'bg-[#DDEBF6]',
      headerColor: 'text-[#2A6FA3]',
      border: 'border-[#C8DEF0]',
    },
    {
      key: 'delegate' as const,
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      bg: 'bg-[#FBF1D6]',
      headerColor: 'text-[#8A6D00]',
      border: 'border-[#F5E5B8]',
    },
    {
      key: 'drop' as const,
      title: 'Drop / Later',
      subtitle: 'Neither',
      bg: 'bg-[#EAEAEA]',
      headerColor: 'text-[#5B6670]',
      border: 'border-[#DCD6C7]',
    },
  ];

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
          Eisenhower Matrix
        </h2>
        <span className="font-mono-code text-[10px] text-[#5B6670] uppercase">
          Dynamic Prioritization
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
        {quadConfig.map(q => {
          const tasks = quadrants[q.key];

          return (
            <div
              key={q.key}
              className={`${q.bg} border ${q.border} rounded-[10px] p-2.5 sm:p-3 min-h-[110px] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className={`font-mono-code text-[11px] font-bold uppercase tracking-wider ${q.headerColor}`}>
                    {q.title}
                  </h3>
                  <span className={`font-mono-code text-[9px] ${q.headerColor} opacity-75`}>
                    {tasks.length}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                  {tasks.length === 0 ? (
                    <div className="text-[11px] text-[#5B6670] opacity-50 italic py-1">
                      Nothing here
                    </div>
                  ) : (
                    tasks.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onJumpToTask(t.id)}
                        className="w-full text-left font-sans text-[11.5px] bg-white/75 hover:bg-white p-1.5 rounded-md shadow-2xs text-[#10202B] truncate block transition-all active:scale-[0.98]"
                        title={t.name}
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="text-[8.5px] font-mono-code text-[#5B6670] pt-1 mt-1 border-t border-black/5 uppercase">
                {q.subtitle}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
