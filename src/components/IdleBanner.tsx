import React from 'react';
import { Domain } from '../types';
import { AlertCircle, ArrowUpRight } from 'lucide-react';

interface IdleBannerProps {
  domains: Domain[];
  onJumpToTask: (taskId: string) => void;
}

export const IdleBanner: React.FC<IdleBannerProps> = ({ domains, onJumpToTask }) => {
  const idleTasks: Array<{ id: string; name: string; domainName: string }> = [];

  domains.forEach(d => {
    d.tasks.forEach(t => {
      if (t.idle) {
        idleTasks.push({ id: t.id, name: t.name, domainName: d.name });
      }
    });
  });

  if (idleTasks.length === 0) return null;

  return (
    <div className="bg-[#FDECEA] border border-[#C4331E] rounded-[8px] p-2.5 sm:p-3 mb-3.5 animate-[fadeUp_0.25s_ease-out]">
      <div className="flex items-center gap-1.5 text-[#C4331E] font-mono-code text-[11px] font-bold uppercase tracking-wide mb-1">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Stalled &mdash; No progress in 3+ days</span>
      </div>
      <div className="space-y-1">
        {idleTasks.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onJumpToTask(t.id)}
            className="w-full text-left text-[12px] text-[#C4331E] hover:underline flex items-center justify-between group py-0.5"
          >
            <span className="truncate pr-2">
              <span className="font-semibold">{t.domainName}</span> &rsaquo; {t.name}
            </span>
            <span className="shrink-0 flex items-center gap-0.5 font-mono-code text-[10px] opacity-80 group-hover:opacity-100">
              <span>Jump</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
