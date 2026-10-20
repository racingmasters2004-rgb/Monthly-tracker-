import React from 'react';
import { ExpenseSubTab } from '../../types';
import { FileText, LayoutDashboard, List, FolderTree, Repeat, BarChart3 } from 'lucide-react';

interface ExpenseHeaderProps {
  currentSubTab: ExpenseSubTab;
  setCurrentSubTab: (tab: ExpenseSubTab) => void;
  onOpenPdfModal: () => void;
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({
  currentSubTab,
  setCurrentSubTab,
  onOpenPdfModal,
}) => {
  const tabs: Array<{ key: ExpenseSubTab; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { key: 'transactions', label: 'History', icon: <List className="w-3.5 h-3.5" /> },
    { key: 'categories', label: 'Budgets', icon: <FolderTree className="w-3.5 h-3.5" /> },
    { key: 'recurring', label: 'Recurring', icon: <Repeat className="w-3.5 h-3.5" /> },
    { key: 'reports', label: 'Reports', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center justify-between gap-1 mb-3.5 border-b border-[#DCD6C7] pb-2 overflow-x-auto no-scrollbar">
      {/* Subtab chips */}
      <div className="flex items-center gap-1 min-w-0">
        {tabs.map(t => {
          const isActive = currentSubTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setCurrentSubTab(t.key)}
              className={`flex items-center gap-1 font-mono-code text-[11px] px-2.5 py-1.5 rounded-md transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-[#1F3A52] text-[#FBFAF7] font-bold shadow-xs'
                  : 'bg-[#F1EEE6] text-[#10202B] hover:bg-[#EAE6DC]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Statement PDF button */}
      <button
        type="button"
        onClick={onOpenPdfModal}
        title="Download Client Financial Statement PDF"
        className="font-mono-code text-[11px] font-semibold px-2.5 py-1.5 rounded border border-[#10202B] bg-[#FBFAF7] text-[#10202B] hover:bg-[#F1EEE6] active:scale-95 transition-all flex items-center gap-1 shrink-0 ml-1"
      >
        <FileText className="w-3.5 h-3.5 text-[#2A7F73]" />
        <span className="hidden xs:inline">Statement</span>
        <span>PDF</span>
      </button>
    </div>
  );
};
