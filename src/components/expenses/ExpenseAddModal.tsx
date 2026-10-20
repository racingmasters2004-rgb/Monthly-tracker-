import React, { useState, useEffect } from 'react';
import { Transaction, ExpenseCategory, PaymentMethod, TransactionType, UserProfile } from '../../types';
import { normalizeTags } from '../../utils/date';
import { X, Check, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface ExpenseAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  profile: UserProfile;
  todayStr: string;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const ExpenseAddModal: React.FC<ExpenseAddModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  paymentMethods,
  profile,
  todayStr,
  initialType = 'expense',
  editingTransaction,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentMethodId, setPaymentMethodId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [payee, setPayee] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.category_id);
      setPaymentMethodId(editingTransaction.payment_method_id);
      setDate(editingTransaction.date);
      setPayee(editingTransaction.payee || '');
      setNote(editingTransaction.note || '');
      setTags(editingTransaction.tags.join(', '));
    } else {
      setType(initialType);
      setAmount('');
      const defaultCats = categories.filter(c => c.type === initialType);
      setCategoryId(defaultCats[0]?.id || '');
      setPaymentMethodId(paymentMethods[0]?.id || '');
      setDate(todayStr);
      setPayee('');
      setNote('');
      setTags('');
    }
  }, [editingTransaction, initialType, isOpen]);

  // When type changes, select first matching category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter(c => c.type === newType);
    if (available.length > 0 && (!categoryId || !available.some(c => c.id === categoryId))) {
      setCategoryId(available[0].id);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type && !c.archived);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }
    if (!categoryId) {
      alert('Please select a category.');
      return;
    }
    if (!paymentMethodId) {
      alert('Please select a payment method.');
      return;
    }

    onSave({
      id: editingTransaction ? editingTransaction.id : undefined,
      type,
      amount: parsedAmount,
      currency: profile.currency,
      date,
      category_id: categoryId,
      payment_method_id: paymentMethodId,
      note: note.trim() || undefined,
      payee: payee.trim() || undefined,
      tags: normalizeTags(tags),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#FBFAF7] border-t-2 sm:border-2 border-[#10202B] rounded-t-[20px] sm:rounded-[18px] max-w-[460px] w-full p-4 sm:p-5 shadow-sheet sm:shadow-xl max-h-[92vh] overflow-y-auto animate-[sheetUp_0.2s_ease-out] sm:animate-[fadeUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C7] mb-3">
          <h3 className="font-disp font-bold text-[16px] text-[#10202B]">
            {editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5B6670] hover:text-[#10202B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Segmented Type Control: Expense vs Income */}
          <div className="flex p-1 rounded-xl border-[1.5px] border-[#10202B] bg-[#F1EEE6]">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-1.5 rounded-lg font-mono-code text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'expense'
                  ? 'bg-[#C4331E] text-white shadow-xs'
                  : 'text-[#10202B] hover:text-[#C4331E]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-1.5 rounded-lg font-mono-code text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                type === 'income'
                  ? 'bg-[#2A7F73] text-white shadow-xs'
                  : 'text-[#10202B] hover:text-[#2A7F73]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Amount ({profile.currency_symbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-disp font-bold text-[20px] text-[#10202B]">
                {profile.currency_symbol}
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                required
                className="w-full pl-9 pr-3 py-2 text-[22px] font-disp font-bold bg-white border-[1.5px] border-[#10202B] rounded-lg focus:outline-none focus:border-[#2A7F73] text-[#10202B]"
              />
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-1 border border-[#DCD6C7] rounded-lg bg-white">
              {filteredCategories.map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-md border text-left flex items-center gap-2 transition-all text-[11px] font-medium truncate ${
                      isSelected
                        ? 'bg-[#10202B] text-white border-[#10202B]'
                        : 'bg-[#FBFAF7] text-[#10202B] border-[#DCD6C7] hover:border-[#10202B]'
                    }`}
                  >
                    <span
                      style={{ backgroundColor: cat.color }}
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Chips */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Payment Method *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {paymentMethods.map(m => {
                const isSelected = paymentMethodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethodId(m.id)}
                    className={`font-mono-code text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-[#10202B] text-white border-[#10202B] font-bold shadow-xs'
                        : 'bg-white text-[#10202B] border-[#DCD6C7] hover:border-[#10202B]'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payee row */}
          <div className="grid grid-cols-2 gap-2 font-mono-code text-[11px]">
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full bg-white border border-[#10202B] rounded px-2.5 py-1.5 text-[12px]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Payee / Vendor
              </label>
              <input
                type="text"
                value={payee}
                onChange={e => setPayee(e.target.value)}
                placeholder="e.g. Swiggy, Shell..."
                className="w-full bg-white border border-[#10202B] rounded px-2.5 py-1.5 text-[12px]"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Team dinner, quarterly subscription..."
              className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12.5px]"
            />
          </div>

          {/* Tags (comma separated) */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="CLIENT, REIMBURSABLE, TRAVEL..."
              className="w-full bg-white border border-[#10202B] rounded px-3 py-1.5 text-[12px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#DCD6C7]">
            <button
              type="button"
              onClick={onClose}
              className="font-mono-code text-[11px] px-3.5 py-2 rounded border border-[#DCD6C7] bg-[#F1EEE6] text-[#5B6670] hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="font-mono-code text-[11.5px] font-bold px-5 py-2 rounded bg-[#10202B] text-white hover:bg-[#1F3A52] active:scale-95 transition-all"
            >
              {editingTransaction ? 'Save Changes' : 'Record Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
