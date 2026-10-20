import React, { useState } from 'react';
import { ExpenseRecurringTemplate, ExpenseCategory, PaymentMethod, Frequency, TransactionType, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/date';
import { Plus, Repeat, Trash2, Calendar, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExpenseRecurringManagerProps {
  recurring: ExpenseRecurringTemplate[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
  todayStr: string;
  onUpdateRecurring: (updated: ExpenseRecurringTemplate[]) => void;
}

export const ExpenseRecurringManager: React.FC<ExpenseRecurringManagerProps> = ({
  recurring,
  categories,
  paymentMethods,
  profile,
  todayStr,
  onUpdateRecurring,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);

  const catMap = new Map(categories.map(c => [c.id, c]));
  const methodMap = new Map(paymentMethods.map(m => [m.id, m]));

  const handleAddTemplate = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const cat = categoryId || categories.find(c => c.type === type)?.id || '';
    const method = paymentMethodId || paymentMethods[0]?.id || '';

    const newTpl: ExpenseRecurringTemplate = {
      id: `exp_rec_${Date.now()}`,
      type,
      amount: parsedAmount,
      category_id: cat,
      payment_method_id: method,
      note: note.trim(),
      frequency,
      day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
      start_on: todayStr,
      active: true,
    };

    onUpdateRecurring([...recurring, newTpl]);
    setAmount('');
    setNote('');
    setShowAddForm(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = recurring.map(r => (r.id === id ? { ...r, active: !r.active } : r));
    onUpdateRecurring(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this recurring expense template?')) return;
    onUpdateRecurring(recurring.filter(r => r.id !== id));
  };

  // Generate upcoming next 30 days projected list
  const upcomingList: Array<{ date: string; template: ExpenseRecurringTemplate }> = [];
  const today = new Date(todayStr + 'T00:00:00');

  for (let i = 1; i <= 30; i++) {
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + i);
    const dateStr = cursor.toISOString().slice(0, 10);
    const dom = cursor.getDate();

    recurring.forEach(tpl => {
      if (!tpl.active) return;
      if (tpl.frequency === 'monthly' && tpl.day_of_month === dom) {
        upcomingList.push({ date: dateStr, template: tpl });
      } else if (tpl.frequency === 'daily') {
        upcomingList.push({ date: dateStr, template: tpl });
      }
    });
  }

  return (
    <div className="space-y-4 pb-12 animate-[fadeUp_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
            Recurring Subscriptions &amp; Income
          </h2>
          <p className="text-[11px] text-[#5B6670]">
            Automatic schedules (Rent, Retainers, Software, SIP).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(prev => !prev)}
          className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded bg-[#10202B] text-[#FBFAF7] hover:bg-[#1F3A52] active:scale-95 transition-all"
        >
          {showAddForm ? 'Close' : '+ Add Recurring'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#F1EEE6] border-[1.5px] border-[#10202B] rounded-[12px] p-3.5 space-y-3 animate-[fadeUp_0.15s_ease-out]">
          <div className="text-[11px] font-mono-code uppercase font-bold text-[#10202B]">
            New Recurring Rule
          </div>

          {/* Type Toggle */}
          <div className="flex p-0.5 rounded-lg border border-[#10202B] bg-white">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1 rounded font-mono-code text-[11px] font-bold ${
                type === 'expense' ? 'bg-[#C4331E] text-white' : 'text-[#10202B]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1 rounded font-mono-code text-[11px] font-bold ${
                type === 'income' ? 'bg-[#2A7F73] text-white' : 'text-[#10202B]'
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Amount ({profile.currency_symbol}) *
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-[13px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as Frequency)}
                className="w-full text-[12px] px-2 py-1.5 bg-white border border-[#10202B] rounded"
              >
                <option value="monthly">Monthly (on day of month)</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>

          {frequency === 'monthly' && (
            <div>
              <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
                Day of Month (1 &ndash; 31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={e => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                className="w-24 text-[13px] px-2.5 py-1 bg-white border border-[#10202B] rounded font-mono-code"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 bg-white border border-[#10202B] rounded"
              >
                {categories.filter(c => c.type === type).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodId}
                onChange={e => setPaymentMethodId(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 bg-white border border-[#10202B] rounded"
              >
                {paymentMethods.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Description / Note
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Office Rent, Cloud Server, Client Retainer..."
              className="w-full text-[12.5px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[11px] font-mono-code px-3 py-1 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTemplate}
              className="text-[11px] font-mono-code font-bold px-4 py-1 rounded bg-[#10202B] text-white"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-2">
        {recurring.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#DCD6C7] rounded-[10px] bg-[#FBFAF7] text-[12px] text-[#5B6670] italic">
            No recurring rules active. Tap '+ Add Recurring' to set up monthly bills.
          </div>
        ) : (
          recurring.map(tpl => {
            const cat = catMap.get(tpl.category_id);
            const method = methodMap.get(tpl.payment_method_id);
            const isIncome = tpl.type === 'income';

            return (
              <div
                key={tpl.id}
                className={`p-3 rounded-[10px] border-[1.5px] bg-white flex items-center justify-between gap-3 ${
                  tpl.active ? 'border-[#10202B]' : 'border-[#DCD6C7] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <div
                    style={{ backgroundColor: `${cat?.color || '#5B6670'}20` }}
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black/5"
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-[#2A7F73]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-[#C4331E]" />
                    )}
                  </div>

                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[13px] text-[#10202B] truncate">
                        {tpl.note || cat?.name || 'Recurring'}
                      </span>
                    </div>
                    <div className="font-mono-code text-[10px] text-[#5B6670] flex items-center gap-1.5">
                      <span>
                        {tpl.frequency === 'monthly'
                          ? `Monthly on ${tpl.day_of_month || 1}st`
                          : 'Daily'}
                      </span>
                      <span>&middot;</span>
                      <span>{method?.name || 'Cash'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className={`font-disp font-bold text-[14px] ${isIncome ? 'text-[#2A7F73]' : 'text-[#C4331E]'}`}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tpl.amount, profile.currency, profile.currency_symbol)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(tpl.id)}
                    className={`font-mono-code text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      tpl.active
                        ? 'bg-[#EBF7EE] text-[#4C8557] border-[#4C8557]'
                        : 'bg-[#F1EEE6] text-[#5B6670] border-[#DCD6C7]'
                    }`}
                  >
                    {tpl.active ? 'Active' : 'Paused'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upcoming next 30 days projection */}
      {upcomingList.length > 0 && (
        <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[12px] p-3 pt-2.5">
          <div className="font-mono-code text-[10.5px] uppercase font-bold text-[#2A7F73] mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Projected Upcoming Entries (Next 30 Days)</span>
          </div>

          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {upcomingList.slice(0, 8).map((it, idx) => {
              const cat = catMap.get(it.template.category_id);
              const isIncome = it.template.type === 'income';

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded-md bg-[#F1EEE6]/70 text-[11.5px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono-code text-[10px] text-[#5B6670]">
                      {it.date}
                    </span>
                    <span className="font-medium text-[#10202B] truncate">
                      {it.template.note || cat?.name}
                    </span>
                  </div>
                  <span className={`font-mono-code font-bold text-[11px] ${
                    isIncome ? 'text-[#2A7F73]' : 'text-[#C4331E]'
                  }`}>
                    {isIncome ? '+' : '-'}
                    {formatCurrency(it.template.amount, profile.currency, profile.currency_symbol)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
