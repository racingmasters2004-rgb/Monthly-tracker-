import React, { useState } from 'react';
import { Domain } from '../types';
import { exportPlannerPdf } from '../utils/pdf';
import { X, FileDown } from 'lucide-react';

interface PlannerPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: Domain[];
  todayStr: string;
  userName?: string;
}

export const PlannerPdfModal: React.FC<PlannerPdfModalProps> = ({
  isOpen,
  onClose,
  domains,
  todayStr,
  userName = 'Harsh Makwana',
}) => {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportPlannerPdf(domains, fromDate, toDate, todayStr, userName);
      setIsExporting(false);
      onClose();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#FBFAF7] border-2 border-[#10202B] rounded-[16px] max-w-[420px] w-full p-4 sm:p-5 shadow-xl animate-[fadeUp_0.2s_ease-out]">
        <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C7] mb-3">
          <h3 className="font-disp font-bold text-[16px] text-[#10202B] flex items-center gap-1.5">
            <FileDown className="w-4 h-4 text-[#2A7F73]" />
            <span>Export Planner PDF Report</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5B6670] hover:text-[#10202B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[12px] text-[#5B6670] mb-3">
          Generates a clean, human-readable PDF grouped by Domain with tasks and subtasks neatly indented.
        </p>

        <div className="space-y-3 mb-4 font-mono-code text-[11px]">
          <div>
            <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
              From Date (Optional)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12px]"
            />
          </div>

          <div>
            <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
              To Date (Optional)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12px]"
            />
          </div>

          <div className="text-[11px] font-sans text-[#5B6670] bg-[#F1EEE6] p-2 rounded border border-[#DCD6C7] italic">
            Leave dates blank to export all active and scheduled items.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#DCD6C7]">
          <button
            type="button"
            onClick={onClose}
            className="font-mono-code text-[11px] px-3.5 py-1.5 rounded border border-[#DCD6C7] bg-[#F1EEE6] text-[#5B6670] hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="font-mono-code text-[11px] font-bold px-4 py-1.5 rounded bg-[#10202B] text-white hover:bg-[#1F3A52] active:scale-95 transition-all flex items-center gap-1.5"
          >
            {isExporting ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
