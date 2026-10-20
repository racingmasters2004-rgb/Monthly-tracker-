import React, { useState } from 'react';
import { Domain } from '../types';
import { computeWeeklyReview } from '../utils/date';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

interface WeeklyReviewProps {
  domains: Domain[];
  todayStr: string;
}

export const WeeklyReview: React.FC<WeeklyReviewProps> = ({ domains, todayStr }) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Compute reference date with offset
  const refDate = new Date(todayStr + 'T00:00:00');
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const refDateStr = refDate.toISOString().slice(0, 10);

  const review = computeWeeklyReview(domains, refDateStr);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxPlanned = Math.max(1, ...dayNames.map(d => review.by_day[d]?.planned || 0));

  const formatShortDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const rangeLabel = `${formatShortDate(review.range.start)} – ${formatShortDate(review.range.end)}`;

  return (
    <section className="bg-[#FBFAF7] border-[1.5px] border-[#10202B] rounded-[14px] p-3.5 sm:p-4 mb-3.5 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono-code text-[10px] sm:text-[11px] tracking-wider text-[#5B6670] uppercase font-medium">
          WEEKLY REVIEW • {rangeLabel}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekOffset(prev => prev - 1)}
            title="Previous week"
            className="w-6 h-6 rounded flex items-center justify-center border border-[#DCD6C7] hover:border-[#10202B] text-[#10202B] active:scale-90 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-[10px] font-mono-code px-1.5 py-0.5 border border-[#10202B] rounded text-[#10202B] hover:bg-[#F1EEE6]"
            >
              Current
            </button>
          )}
          <button
            type="button"
            onClick={() => setWeekOffset(prev => prev + 1)}
            title="Next week"
            className="w-6 h-6 rounded flex items-center justify-center border border-[#DCD6C7] hover:border-[#10202B] text-[#10202B] active:scale-90 transition-all"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-disp text-[32px] sm:text-[38px] font-bold text-[#10202B] leading-none">
          {review.total_done}
        </span>
        <span className="text-[12px] sm:text-[13px] text-[#5B6670] font-medium">
          of {review.total_planned} planned items completed
        </span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 mt-2 text-[#5B6670] font-mono-code text-[10px] sm:text-[11px]">
        <div>
          <b className="text-[14px] text-[#10202B] font-disp font-bold block">
            {review.weighted_done}
          </b>
          <span>Weighted score</span>
        </div>
        <div>
          <b className="text-[14px] text-[#10202B] font-disp font-bold block">
            {Math.max(0, review.total_planned - review.total_done)}
          </b>
          <span>Remaining</span>
        </div>
      </div>

      {/* Week Bars (Mon–Sun) */}
      <div className="flex justify-between items-end gap-1.5 sm:gap-2 mt-3.5 h-[76px] pt-2">
        {dayNames.map(dayName => {
          const info = review.by_day[dayName] || { planned: 0, done: 0 };
          const fillRatio = info.planned > 0 ? info.done / info.planned : 0;
          const trackHeightPct = info.planned > 0
            ? Math.max(14, Math.round((info.planned / maxPlanned) * 100))
            : 6;

          return (
            <div key={dayName} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                style={{ height: `${trackHeightPct}%` }}
                className="w-full max-w-[28px] bg-[#F1EEE6] border border-[#DCD6C7] rounded-t-[5px] flex items-end overflow-hidden"
              >
                <div
                  style={{ height: `${Math.round(fillRatio * 100)}%` }}
                  className="w-full bg-[#2A7F73] transition-all duration-500 ease-out"
                />
              </div>
              <span className="font-mono-code text-[8px] sm:text-[9px] text-[#5B6670] mt-1">
                {info.done}/{info.planned}
              </span>
              <span className="font-mono-code text-[9.5px] sm:text-[10px] text-[#10202B] font-bold">
                {dayName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Domain Breakdown for this week */}
      {review.by_domain.length > 0 && (
        <div className="mt-3.5 pt-2.5 border-t border-dashed border-[#DCD6C7] space-y-1.5">
          {review.by_domain.map(dom => (
            <div key={dom.id} className="flex items-center justify-between text-[11px]">
              <span className="text-[#10202B] truncate mr-2 font-medium">{dom.name}</span>
              <span className="font-mono-code text-[10.5px] text-[#2A7F73] shrink-0">
                {dom.done} / {dom.planned} done ({Math.round((dom.done / dom.planned) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
