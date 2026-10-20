import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Home,
  IndianRupee,
  DollarSign,
  Settings,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Smartphone
} from 'lucide-react';
import { MainTab, UserProfile } from '../types';
import { generateQuote } from '../utils/quotes';

interface HeaderProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  calendarOpen: boolean;
  setCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onHomeClick: () => void;
  onOpenSettings: () => void;
  onOpenInstallPrompt: () => void;
  profile: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  calendarOpen,
  setCalendarOpen,
  onHomeClick,
  onOpenSettings,
  onOpenInstallPrompt,
  profile,
}) => {
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    setQuote(generateQuote());
  }, []);

  const refreshQuote = () => {
    setQuote(generateQuote());
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FBFAF7] border-b-2 border-[#10202B] px-3.5 pt-3 pb-2.5 shadow-sm">
      <div className="max-w-[700px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] sm:text-[20px] font-bold text-[#10202B] flex items-center gap-2 tracking-tight">
              {activeTab === 'planner' ? (
                <>
                  <span>Monthly Planner</span>
                  <span className="font-mono-code text-[10px] uppercase tracking-wider bg-[#10202B] text-[#FBFAF7] px-2 py-0.5 rounded-full font-semibold">
                    v8 Pro
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-[#1F3A52]">
                    <Wallet className="w-5 h-5 text-[#2A7F73]" />
                    <span>Expense Tracker</span>
                  </span>
                  <span className="font-mono-code text-[10px] uppercase tracking-wider bg-[#2A7F73] text-[#FBFAF7] px-2 py-0.5 rounded-full font-semibold">
                    Live
                  </span>
                </>
              )}
            </h1>
          </div>

          {/* Action icon buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Home button */}
            <button
              type="button"
              onClick={onHomeClick}
              title="Home (Reset view)"
              className="w-[34px] h-[34px] rounded-lg border-[1.5px] border-[#10202B] flex items-center justify-center text-[#10202B] hover:bg-[#F1EEE6] active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Calendar toggle button */}
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'planner') setActiveTab('planner');
                setCalendarOpen(prev => !prev);
              }}
              title={calendarOpen ? 'Close calendar' : 'Open calendar'}
              className={`w-[34px] h-[34px] rounded-lg border-[1.5px] border-[#10202B] flex items-center justify-center transition-all active:scale-95 ${
                calendarOpen && activeTab === 'planner'
                  ? 'bg-[#10202B] text-[#FBFAF7]'
                  : 'text-[#10202B] hover:bg-[#F1EEE6]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>

            {/* Expenses switch icon (placed right beside Calendar icon as requested!) */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'planner' ? 'expenses' : 'planner')}
              title={activeTab === 'planner' ? 'Switch to Expense Tracker' : 'Switch to Monthly Planner'}
              className={`h-[34px] px-2.5 rounded-lg border-[1.5px] border-[#10202B] flex items-center gap-1.5 font-mono-code text-[11px] font-bold transition-all active:scale-95 ${
                activeTab === 'expenses'
                  ? 'bg-[#1F3A52] text-[#FBFAF7]'
                  : 'bg-[#FBFAF7] text-[#10202B] hover:bg-[#F1EEE6]'
              }`}
            >
              <Wallet className="w-4 h-4 text-[#2A7F73]" />
              <span className="hidden xs:inline">
                {activeTab === 'planner' ? 'Expenses' : 'Planner'}
              </span>
            </button>

            {/* Download / Install to Phone button */}
            <button
              type="button"
              onClick={onOpenInstallPrompt}
              title="Download to Phone / Install App"
              className="h-[34px] px-2 rounded-lg border-[1.5px] border-[#2A7F73] bg-[#EBF7EE] flex items-center gap-1 text-[#2A7F73] hover:bg-[#DDF0E2] active:scale-95 transition-all font-mono-code text-[11px] font-bold"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install</span>
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Settings & Profile"
              className="w-[34px] h-[34px] rounded-lg border-[1.5px] border-[#10202B] flex items-center justify-center text-[#10202B] hover:bg-[#F1EEE6] active:scale-95 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Motivational rotating quote bar */}
        <div
          onClick={refreshQuote}
          title="Click to generate a new motivational quote"
          className="group cursor-pointer font-mono-code text-[11px] text-[#2A7F73] pt-2 pb-0.5 italic flex items-center justify-between gap-2 select-none hover:text-[#1F3A52] transition-colors"
        >
          <div className="truncate">
            “{quote}”
          </div>
          <RefreshCw className="w-3 h-3 text-[#5B6670] opacity-50 group-hover:opacity-100 group-hover:rotate-180 transition-all flex-shrink-0" />
        </div>
      </div>
    </header>
  );
};
