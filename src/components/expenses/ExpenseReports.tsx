import React from 'react';
import { Transaction, ExpenseCategory, PaymentMethod, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/date';
import { BarChart3, TrendingUp, PieChart, ArrowDownRight } from 'lucide-react';

interface ExpenseReportsProps {
  transactions: Transaction[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
}

export const ExpenseReports: React.FC<ExpenseReportsProps> = ({
  transactions,
  categories,
  paymentMethods,
  profile,
}) => {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const methodMap = new Map(paymentMethods.map(m => [m.id, m]));

  // Compute 6-month historical trends
  const now = new Date();
  const monthsData: Array<{ monthStr: string; label: string; income: number; expense: number }> = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short' });

    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.date.startsWith(mStr)) {
        if (t.type === 'income') inc += t.amount;
        else exp += t.amount;
      }
    });

    monthsData.push({ monthStr: mStr, label, income: inc, expense: exp });
  }

  const maxVal = Math.max(1, ...monthsData.flatMap(m => [m.income, m.expense]));

  // Top 5 Expenses of all time or current period
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  expenseTransactions.sort((a, b) => b.amount - a.amount);
  const top5Expenses = expenseTransactions.slice(0, 5);

  // Overall category distribution
  let totalExpenseAllTime = 0;
  const catDistribution: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    totalExpenseAllTime += t.amount;
    catDistribution[t.category_id] = (catDistribution[t.category_id] || 0) + t.amount;
  });

  const sortedCatShare = Object.entries(catDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([catId, amount]) => {
      const cat = catMap.get(catId);
      const share = totalExpenseAllTime > 0 ? (amount / totalExpenseAllTime) * 100 : 0;
      return {
        id: catId,
        name: cat?.name || 'General',
        color: cat?.color || '#5B6670',
        amount,
        share,
      };
    });

  return (
    <div className="space-y-4 pb-12 animate-[fadeUp_0.2s_ease-out]">
      <div>
        <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
          Analytics &amp; Cash Flow Trends
        </h2>
        <p className="text-[11px] text-[#5B6670]">
          6-month historical trends and expenditure breakdown.
        </p>
      </div>

      {/* 6-Month Income vs Expense Bar Chart */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider">
            6-Month Cash Flow (Income vs Expense)
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono-code">
            <span className="flex items-center gap-1 text-[#2A7F73]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2A7F73]" />
              <span>Income</span>
            </span>
            <span className="flex items-center gap-1 text-[#C4331E]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C4331E]" />
              <span>Expense</span>
            </span>
          </div>
        </div>

        {/* Bar chart columns */}
        <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1 border-b border-[#DCD6C7]">
          {monthsData.map(m => {
            const incPct = Math.round((m.income / maxVal) * 100);
            const expPct = Math.round((m.expense / maxVal) * 100);

            return (
              <div key={m.monthStr} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  {/* Income bar */}
                  <div
                    style={{ height: `${Math.max(4, incPct)}%` }}
                    className="w-1/2 max-w-[14px] bg-[#2A7F73] rounded-t-xs transition-all duration-500"
                    title={`Income: ${formatCurrency(m.income, profile.currency, profile.currency_symbol)}`}
                  />
                  {/* Expense bar */}
                  <div
                    style={{ height: `${Math.max(4, expPct)}%` }}
                    className="w-1/2 max-w-[14px] bg-[#C4331E] rounded-t-xs transition-all duration-500"
                    title={`Expense: ${formatCurrency(m.expense, profile.currency, profile.currency_symbol)}`}
                  />
                </div>
                <span className="font-mono-code text-[9px] font-bold text-[#10202B] mt-1.5">
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 5 Expenses */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3.5 shadow-xs">
        <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider block mb-2.5">
          Top 5 Single Highest Expenses
        </span>

        {top5Expenses.length === 0 ? (
          <div className="text-[12px] text-[#5B6670] italic py-2">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {top5Expenses.map((t, idx) => {
              const cat = catMap.get(t.category_id);
              const method = methodMap.get(t.payment_method_id);

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#F1EEE6] text-[12px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono-code text-[10px] font-bold text-[#5B6670] w-4">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-[#10202B] truncate">
                      {t.note || cat?.name}
                    </span>
                    {t.payee && (
                      <span className="text-[10.5px] text-[#5B6670] truncate">
                        &middot; {t.payee}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono-code text-[10px] text-[#5B6670]">
                      {t.date}
                    </span>
                    <span className="font-disp font-bold text-[#C4331E]">
                      {formatCurrency(t.amount, profile.currency, profile.currency_symbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall Category Share Table */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3.5 shadow-xs">
        <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#5B6670] tracking-wider block mb-2.5">
          Total Category Share (% of All-Time Spend)
        </span>

        <div className="space-y-2">
          {sortedCatShare.map(c => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    style={{ backgroundColor: c.color }}
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                  />
                  <span className="text-[#10202B] font-medium truncate">{c.name}</span>
                </div>
                <div className="font-mono-code text-[11px] text-[#10202B] font-semibold">
                  <span>{formatCurrency(c.amount, profile.currency, profile.currency_symbol)}</span>
                  <span className="text-[#5B6670] ml-1 font-normal">({c.share.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#F1EEE6] overflow-hidden">
                <div
                  style={{ width: `${c.share}%`, backgroundColor: c.color }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
