import React, { useState } from 'react';
import { Transaction, ExpenseCategory, PaymentMethod, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/date';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Plus
} from 'lucide-react';

interface ExpenseTransactionsProps {
  transactions: Transaction[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
  todayStr: string;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const ExpenseTransactions: React.FC<ExpenseTransactionsProps> = ({
  transactions,
  categories,
  paymentMethods,
  profile,
  todayStr,
  onDeleteTransaction,
  onEditTransaction,
  onOpenAddModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const catMap = new Map(categories.map(c => [c.id, c]));
  const methodMap = new Map(paymentMethods.map(m => [m.id, m]));

  // Filter transactions
  const filtered = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCatId && t.category_id !== selectedCatId) return false;
    if (selectedMethodId && t.payment_method_id !== selectedMethodId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cat = catMap.get(t.category_id)?.name.toLowerCase() || '';
      const method = methodMap.get(t.payment_method_id)?.name.toLowerCase() || '';
      const note = (t.note || '').toLowerCase();
      const payee = (t.payee || '').toLowerCase();
      const hasTag = t.tags.some(tag => tag.toLowerCase().includes(q));

      if (!cat.includes(q) && !method.includes(q) && !note.includes(q) && !payee.includes(q) && !hasTag) {
        return false;
      }
    }

    return true;
  });

  // Sort by date descending
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  // Group by date
  const groups: Record<string, Transaction[]> = {};
  filtered.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  const getDayHeading = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today';
    const yest = new Date(todayStr + 'T00:00:00');
    yest.setDate(yest.getDate() - 1);
    if (dateStr === yest.toISOString().slice(0, 10)) return 'Yesterday';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3 pb-16 animate-[fadeUp_0.2s_ease-out]">
      {/* Search & Filter Header */}
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by note, payee, category, or #tag…"
            className="w-full font-sans text-[13px] pl-9 pr-8 py-2 border-[1.5px] border-[#10202B] rounded-full bg-[#FBFAF7] text-[#10202B] placeholder-[#5B6670] focus:outline-none focus:border-[#2A7F73]"
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

        {/* Filter Controls Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-mono-code">
          {/* Type Toggle Pills */}
          <div className="flex p-0.5 rounded-lg border border-[#10202B] bg-[#F1EEE6] shrink-0">
            {(['all', 'expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterType === t
                    ? 'bg-[#10202B] text-white font-bold'
                    : 'text-[#10202B] hover:text-[#2A7F73]'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCatId}
            onChange={e => setSelectedCatId(e.target.value)}
            className="bg-[#FBFAF7] border border-[#10202B] rounded-lg px-2.5 py-1 text-[11px] shrink-0 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={selectedMethodId}
            onChange={e => setSelectedMethodId(e.target.value)}
            className="bg-[#FBFAF7] border border-[#10202B] rounded-lg px-2.5 py-1 text-[11px] shrink-0 focus:outline-none"
          >
            <option value="">All Methods</option>
            {paymentMethods.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction Groups */}
      {Object.keys(groups).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#DCD6C7] rounded-[12px] bg-[#FBFAF7]">
          <p className="text-[13px] text-[#5B6670] italic mb-3">No transactions found.</p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="font-mono-code text-[11px] font-bold px-3 py-1.5 rounded bg-[#10202B] text-white"
          >
            + Add First Transaction
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([dateStr, items]) => {
            const dayHeading = getDayHeading(dateStr);
            const dayTotal = items.reduce(
              (acc, it) => (it.type === 'income' ? acc + it.amount : acc - it.amount),
              0
            );

            return (
              <div key={dateStr} className="space-y-1.5">
                {/* Date Heading */}
                <div className="flex items-center justify-between px-1 font-mono-code text-[10.5px]">
                  <span className="font-bold text-[#10202B] uppercase tracking-wider">
                    {dayHeading} &middot; <span className="font-normal text-[#5B6670]">{dateStr}</span>
                  </span>
                  <span className={`font-semibold ${dayTotal >= 0 ? 'text-[#2A7F73]' : 'text-[#C4331E]'}`}>
                    Net: {formatCurrency(dayTotal, profile.currency, profile.currency_symbol)}
                  </span>
                </div>

                {/* Items in this day */}
                <div className="border border-[#DCD6C7] rounded-[12px] bg-white divide-y divide-[#F1EEE6] overflow-hidden shadow-2xs">
                  {items.map(tx => {
                    const cat = catMap.get(tx.category_id);
                    const method = methodMap.get(tx.payment_method_id);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 flex items-center justify-between gap-2.5 hover:bg-[#FBFAF7] transition-colors"
                      >
                        {/* Left: Icon & Description */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div
                            style={{ backgroundColor: `${cat?.color || '#5B6670'}20` }}
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-black/5"
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4 text-[#2A7F73]" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 text-[#C4331E]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[13px] text-[#10202B] truncate">
                                {cat?.name || 'General'}
                              </span>
                              {tx.payee && (
                                <span className="text-[11px] text-[#5B6670] truncate">
                                  &middot; {tx.payee}
                                </span>
                              )}
                            </div>

                            {/* Note and tags */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[#5B6670] mt-0.5">
                              {tx.note && (
                                <span className="italic truncate">{tx.note}</span>
                              )}
                              <span className="font-mono-code bg-[#F1EEE6] px-1.5 py-0.2 rounded text-[#10202B]">
                                {method?.name || 'Cash'}
                              </span>
                              {tx.tags.map(t => (
                                <span key={t} className="font-mono-code bg-[#FBFAF7] border border-[#DCD6C7] px-1 rounded">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`font-disp font-bold text-[14px] sm:text-[15px] ${
                            isIncome ? 'text-[#2A7F73]' : 'text-[#C4331E]'
                          }`}>
                            {isIncome ? '+' : '-'}
                            {formatCurrency(tx.amount, profile.currency, profile.currency_symbol)}
                          </div>

                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit transaction"
                            className="p-1 text-[#5B6670] hover:text-[#10202B]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete this transaction?')) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            title="Delete transaction"
                            className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Add FAB button */}
      <div className="fixed bottom-5 right-5 z-20">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-12 px-4 rounded-full bg-[#1F3A52] text-[#FBFAF7] shadow-lg hover:bg-[#10202B] active:scale-95 transition-all flex items-center gap-2 font-mono-code text-[12px] font-bold border-2 border-[#FBFAF7]"
        >
          <Plus className="w-4 h-4 text-[#D9A017]" />
          <span>New Entry</span>
        </button>
      </div>
    </div>
  );
};
