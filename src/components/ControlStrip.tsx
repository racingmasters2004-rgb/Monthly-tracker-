import React from 'react';
import { FilterView } from '../types';
import { Search, Tag } from 'lucide-react';

interface ControlStripProps {
  currentView: FilterView;
  setCurrentView: (view: FilterView) => void;
  viewCounts: Record<FilterView, number>;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  availableTags: Array<{ tag: string; count: number }>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const ControlStrip: React.FC<ControlStripProps> = ({
  currentView,
  setCurrentView,
  viewCounts,
  selectedTag,
  setSelectedTag,
  availableTags,
  searchQuery,
  setSearchQuery,
}) => {
  const views: Array<{ key: FilterView; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'week', label: 'This Week' },
    { key: 'done', label: 'Done' },
  ];

  return (
    <div className="space-y-2 mb-3">
      {/* Top row: Horizontal view scroll & tag dropdown */}
      <div className="flex items-center gap-2">
        {/* Horizontal scrollable view pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1 min-w-0 no-scrollbar">
          {views.map(v => {
            const count = viewCounts[v.key] ?? 0;
            const isActive = currentView === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setCurrentView(v.key)}
                className={`font-mono-code text-[11px] px-2.5 py-1.5 rounded-[6px] border-[1.5px] whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-[#10202B] text-[#FBFAF7] border-[#10202B] font-bold shadow-xs'
                    : 'bg-[#FBFAF7] text-[#10202B] border-[#10202B] hover:bg-[#F1EEE6]'
                }`}
              >
                <span>{v.label}</span>
                <span className={`ml-1 text-[10px] ${isActive ? 'text-[#DCD6C7]' : 'text-[#5B6670]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag filter dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="font-mono-code text-[11px] bg-[#FBFAF7] text-[#10202B] border-[1.5px] border-[#10202B] rounded-full px-3 py-1.5 pr-7 max-w-[150px] sm:max-w-[180px] truncate cursor-pointer focus:outline-none focus:border-[#2A7F73]"
          >
            <option value="">All Tags / People ({availableTags.length})</option>
            {availableTags.map(({ tag, count }) => (
              <option key={tag} value={tag}>
                #{tag} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tasks, subtasks, or #tags…"
          className="w-full font-sans text-[13px] pl-9 pr-8 py-2 border-[1.5px] border-[#10202B] rounded-full bg-[#FBFAF7] text-[#10202B] placeholder-[#5B6670] focus:outline-none focus:border-[#2A7F73] transition-colors"
        />
        <Search className="w-4 h-4 text-[#5B6670] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5B6670] hover:text-[#10202B]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
