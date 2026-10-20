import React, { useState } from 'react';
import { Transaction, ExpenseCategory, PaymentMethod, UserProfile } from '../../types';
import { exportExpensePdf } from '../../utils/pdf';
import { X, FileDown, Calendar, Check } from 'lucide-react';

interface ExpensePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
  initialMonthStr: string; // YYYY-MM
}

export const ExpensePdfModal: React.FC<ExpensePdfModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  paymentMethods,
  profile,
  initialMonthStr,
}) => {
  const [mode, setMode] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonthStr);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);

    let start = fromDate;
    let end = toDate;

    if (mode === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = `${selectedMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    setTimeout(() => {
      exportExpensePdf(
        transactions,
        categories,
        paymentMethods,
        start,
        end,
        profile.currency_symbol,
        profile.currency,
        profile.display_name
      );
      setIsExporting(false);
      onClose();
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#FBFAF7] border-2 border-[#10202B] rounded-[16px] max-w-[420px] w-full p-4 sm:p-5 shadow-xl animate-[fadeUp_0.2s_ease-out]">
        <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C7] mb-3">
          <h3 className="font-disp font-bold text-[16px] text-[#10202B] flex items-center gap-1.5">
            <FileDown className="w-4 h-4 text-[#2A7F73]" />
            <span>Client Financial Statement</span>
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
          Generates an executive statement with top KPI row, category table, payment method share, and a bank-statement ledger with debit, credit, and running balance.
        </p>

        {/* Range mode toggle */}
        <div className="flex p-0.5 rounded-lg border border-[#10202B] bg-[#F1EEE6] mb-3">
          <button
            type="button"
            onClick={() => setMode('month')}
            className={`flex-1 py-1 font-mono-code text-[11px] font-bold rounded transition-all ${
              mode === 'month' ? 'bg-[#10202B] text-white shadow-xs' : 'text-[#10202B]'
            }`}
          >
            Monthly Statement
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 py-1 font-mono-code text-[11px] font-bold rounded transition-all ${
              mode === 'custom' ? 'bg-[#10202B] text-white shadow-xs' : 'text-[#10202B]'
            }`}
          >
            Custom Date Range
          </button>
        </div>

        <div className="space-y-3 mb-4 font-mono-code text-[11px]">
          {mode === 'month' ? (
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Select Statement Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12px]"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                  From Date
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
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12px]"
                />
              </div>
            </>
          )}

          <div className="bg-[#F1EEE6] p-2 rounded border border-[#DCD6C7] text-[11px] font-sans text-[#5B6670]">
            Statement will include: Title header, Account Holder name, KPI summary cards, Category distribution, Payment method breakdown, and chronological Ledger.
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
            {isExporting ? 'Generating PDF...' : 'Download Statement'}
          </button>
        </div>
      </div>
    </div>
  );
};
