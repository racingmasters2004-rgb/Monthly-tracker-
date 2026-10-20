import React from 'react';
import { Transaction, ExpenseCategory, PaymentMethod, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/date';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  AlertCircle
} from 'lucide-react';

interface ExpenseOverviewProps {
  transactions: Transaction[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
  selectedMonthYear: { year: number; month: number };
  setSelectedMonthYear: React.Dispatch<React.SetStateAction<{ year: number; month: number }>>;
  onOpenAddModal: (type?: 'expense' | 'income') => void;
  onGoToTransactions: () => void;
  onGoToBudgets: () => void;
}

export const ExpenseOverview: React.FC<ExpenseOverviewProps> = ({
  transactions,
  categories,
  paymentMethods,
  profile,
  selectedMonthYear,
  setSelectedMonthYear,
  onOpenAddModal,
  onGoToTransactions,
  onGoToBudgets,
}) => {
  const { year, month } = selectedMonthYear;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // Month navigation
  const shiftMonth = (delta: number) => {
    setSelectedMonthYear(prev => {
      let y = prev.year;
      let m = prev.month + delta;
      if (m < 1) {
        m = 12;
        y--;
      } else if (m > 12) {
        m = 1;
        y++;
      }
      return { year: y, month: m };
    });
  };

  const goCurrentMonth = () => {
    const now = new Date();
    setSelectedMonthYear({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Filter transactions for this month
  const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr));

  let totalIncome = 0;
  let totalExpense = 0;
  const catSpent: Record<string, number> = {};
  const methodSpent: Record<string, number> = {};

  monthTransactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      catSpent[t.category_id] = (catSpent[t.category_id] || 0) + t.amount;
      methodSpent[t.payment_method_id] = (methodSpent[t.payment_method_id] || 0) + t.amount;
    }
  });

  const netSavings = totalIncome - totalExpense;

  // Category shares
  const catMap = new Map(categories.map(c => [c.id, c]));
  const sortedExpenses = Object.entries(catSpent)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, amount]) => {
      const cat = catMap.get(catId);
      const share = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'General',
        color: cat?.color || '#5B6670',
        icon: cat?.icon || 'Tag',
        amount,
        share,
        budget: cat?.monthly_budget ?? null,
      };
    });

  // Budget tracking for categories with a defined monthly budget
  const budgetedCategories = categories
    .filter(c => c.type === 'expense' && typeof c.monthly_budget === 'number' && c.monthly_budget > 0)
    .map(c => {
      const spent = catSpent[c.id] || 0;
      const budget = c.monthly_budget!;
      const pct = Math.round((spent / budget) * 100);
      return {
        id: c.id,
        name: c.name,
        color: c.color,
        spent,
        budget,
        pct,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-4 pb-12 animate-[fadeUp_0.2s_ease-out]">
      {/* Month Navigator */}
      <div className="bg-[#FBFAF7] border-[1.5px] border-[#10202B] rounded-[12px] p-2 sm:p-2.5 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          title="Previous month"
          className="w-7 h-7 rounded border border-[#DCD6C7] hover:border-[#10202B] flex items-center justify-center text-[#10202B] active:scale-90"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <h2 className="font-disp font-bold text-[15px] sm:text-[16px] text-[#10202B]">
            {monthLabel}
          </h2>
          <button
            type="button"
            onClick={goCurrentMonth}
            className="text-[10px] font-mono-code px-2 py-0.5 rounded border border-[#10202B] hover:bg-[#F1EEE6] font-semibold text-[#10202B]"
          >
            Current
          </button>
        </div>

        <button
          type="button"
          onClick={() => shiftMonth(1)}
          title="Next month"
          className="w-7 h-7 rounded border border-[#DCD6C7] hover:border-[#10202B] flex items-center justify-center text-[#10202B] active:scale-90"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Total Income */}
        <div className="bg-[#F0F8F4] border border-[#2A7F73]/30 rounded-[12px] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[9px] sm:text-[10px] uppercase font-bold text-[#2A7F73]">
              Income
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#2A7F73]" />
          </div>
          <div className="font-disp font-bold text-[15px] sm:text-[19px] text-[#2A7F73] mt-1.5 leading-tight truncate">
            {formatCurrency(totalIncome, profile.currency, profile.currency_symbol)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-[#FEF3F2] border border-[#C4331E]/30 rounded-[12px] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[9px] sm:text-[10px] uppercase font-bold text-[#C4331E]">
              Expense
            </span>
            <ArrowDownRight className="w-3.5 h-3.5 text-[#C4331E]" />
          </div>
          <div className="font-disp font-bold text-[15px] sm:text-[19px] text-[#C4331E] mt-1.5 leading-tight truncate">
            {formatCurrency(totalExpense, profile.currency, profile.currency_symbol)}
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-[#F1F5F9] border border-[#1F3A52]/30 rounded-[12px] p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[9px] sm:text-[10px] uppercase font-bold text-[#1F3A52]">
              Net Balance
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#1F3A52]" />
          </div>
          <div className={`font-disp font-bold text-[15px] sm:text-[19px] mt-1.5 leading-tight truncate ${
            netSavings >= 0 ? 'text-[#1F3A52]' : 'text-[#C4331E]'
          }`}>
            {formatCurrency(netSavings, profile.currency, profile.currency_symbol)}
          </div>
        </div>
      </div>

      {/* Payment Method Totals (Cash / Card / UPI cards) */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider">
            Breakdown by Payment Method
          </span>
          <span className="font-mono-code text-[9.5px] text-[#5B6670]">
            {paymentMethods.length} methods
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map(pm => {
            const spent = methodSpent[pm.id] || 0;
            return (
              <div
                key={pm.id}
                className="bg-[#F1EEE6] p-2 sm:p-2.5 rounded-[9px] border border-[#DCD6C7] flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-mono-code text-[10px] text-[#5B6670] truncate">
                  {pm.name.toLowerCase().includes('card') ? (
                    <CreditCard className="w-3 h-3 text-[#1F3A52]" />
                  ) : pm.name.toLowerCase().includes('upi') ? (
                    <Smartphone className="w-3 h-3 text-[#2A7F73]" />
                  ) : pm.name.toLowerCase().includes('cash') ? (
                    <Banknote className="w-3 h-3 text-[#B8860B]" />
                  ) : (
                    <Building className="w-3 h-3 text-[#7A4F82]" />
                  )}
                  <span className="font-semibold text-[#10202B] truncate">{pm.name}</span>
                </div>
                <div className="font-disp font-bold text-[13.5px] text-[#10202B] mt-1">
                  {formatCurrency(spent, profile.currency, profile.currency_symbol)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown (Visual Stacked Bar & List) */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider">
            Expenditure by Category
          </span>
          <button
            type="button"
            onClick={onGoToTransactions}
            className="text-[10px] font-mono-code text-[#2A7F73] hover:underline"
          >
            View all transactions &rarr;
          </button>
        </div>

        {totalExpense === 0 ? (
          <div className="text-center py-4 text-[12px] text-[#5B6670] italic">
            No expenses recorded for this month yet.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Visual Multi-Segment Distribution Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-[#F1EEE6] shadow-2xs">
              {sortedExpenses.map(item => (
                <div
                  key={item.id}
                  style={{ width: `${item.share}%`, backgroundColor: item.color }}
                  title={`${item.name}: ${item.share.toFixed(1)}%`}
                  className="h-full transition-all duration-500"
                />
              ))}
            </div>

            {/* Top categories breakdown list */}
            <div className="space-y-2 pt-1">
              {sortedExpenses.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      style={{ backgroundColor: item.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="text-[#10202B] font-medium truncate">{item.name}</span>
                    <span className="font-mono-code text-[10px] text-[#5B6670]">
                      ({item.share.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="font-mono-code font-semibold text-[#10202B] shrink-0">
                    {formatCurrency(item.amount, profile.currency, profile.currency_symbol)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Budget Progress Bars (calm -> amber >= 80% -> red > 100%) */}
      {budgetedCategories.length > 0 && (
        <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider">
              Category Budgets ({budgetedCategories.length})
            </span>
            <button
              type="button"
              onClick={onGoToBudgets}
              className="text-[10px] font-mono-code text-[#2A7F73] hover:underline"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {budgetedCategories.map(b => {
              const isOver = b.pct > 100;
              const isWarning = b.pct >= 80 && !isOver;

              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-medium text-[#10202B] truncate">{b.name}</span>
                      {isOver && (
                        <span className="text-[9.5px] font-mono-code bg-[#FDECEA] text-[#C4331E] px-1.5 py-0.2 rounded font-bold">
                          Exceeded
                        </span>
                      )}
                    </div>
                    <div className="font-mono-code text-[10.5px] text-[#5B6670]">
                      <span className={isOver ? 'text-[#C4331E] font-bold' : 'text-[#10202B]'}>
                        {formatCurrency(b.spent, profile.currency, profile.currency_symbol)}
                      </span>
                      <span> / {formatCurrency(b.budget, profile.currency, profile.currency_symbol)}</span>
                      <span className="ml-1 font-bold">({b.pct}%)</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-[#F1EEE6] overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                      className={`h-full transition-all duration-500 ease-out ${
                        isOver
                          ? 'bg-[#C4331E]'
                          : isWarning
                          ? 'bg-[#D9A017]'
                          : 'bg-[#4C8557]'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Button (Quick Add Transaction) for phone use */}
      <div className="fixed bottom-5 right-5 z-20 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => onOpenAddModal('expense')}
          className="h-12 px-4 rounded-full bg-[#1F3A52] text-[#FBFAF7] shadow-lg hover:bg-[#10202B] active:scale-95 transition-all flex items-center gap-2 font-mono-code text-[12px] font-bold border-2 border-[#FBFAF7]"
        >
          <Plus className="w-4 h-4 text-[#D9A017]" />
          <span>Add Transaction</span>
        </button>
      </div>
    </div>
  );
};
