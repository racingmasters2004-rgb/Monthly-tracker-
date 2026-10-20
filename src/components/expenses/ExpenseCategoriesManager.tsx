import React, { useState } from 'react';
import { ExpenseCategory, TransactionType, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/date';
import { Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

interface ExpenseCategoriesManagerProps {
  categories: ExpenseCategory[];
  onUpdateCategories: (categories: ExpenseCategory[]) => void;
  profile: UserProfile;
}

const COLOR_PALETTE = [
  '#1F3A52', // Navy
  '#2A7F73', // Teal
  '#7A4F82', // Plum
  '#D9A017', // Amber / Ochre
  '#D9531E', // Brick / High
  '#4C8557', // Sage / Green
  '#2A6FA3', // Tomorrow blue
  '#8A5A3B', // Cinnamon
  '#C4331E', // Garnet / Red
  '#5B6670', // Slate grey
];

export const ExpenseCategoriesManager: React.FC<ExpenseCategoriesManagerProps> = ({
  categories,
  onUpdateCategories,
  profile,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>(COLOR_PALETTE[0]);
  const [budget, setBudget] = useState<string>('');

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editBudget, setEditBudget] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');

  const filtered = categories.filter(c => c.type === activeTab);

  const handleAddCategory = () => {
    if (!name.trim()) return;
    const parsedBudget = budget.trim() ? parseFloat(budget) : null;

    const newCat: ExpenseCategory = {
      id: `cat_${Date.now()}`,
      name: name.trim(),
      type: activeTab,
      icon: 'Tag',
      color: color,
      sort_order: categories.length + 1,
      monthly_budget: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : null,
    };

    onUpdateCategories([...categories, newCat]);
    setName('');
    setBudget('');
    setShowAddForm(false);
  };

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditBudget(cat.monthly_budget !== null && cat.monthly_budget !== undefined ? cat.monthly_budget.toString() : '');
    setEditColor(cat.color);
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) return;
    const parsedBudget = editBudget.trim() ? parseFloat(editBudget) : null;

    const updated = categories.map(c =>
      c.id === catId
        ? {
            ...c,
            name: editName.trim(),
            color: editColor,
            monthly_budget: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : null,
          }
        : c
    );

    onUpdateCategories(updated);
    setEditingCatId(null);
  };

  const handleDelete = (catId: string) => {
    if (!confirm('Delete this category? (Existing transactions will remain in history)')) return;
    onUpdateCategories(categories.filter(c => c.id !== catId));
  };

  return (
    <div className="space-y-4 pb-12 animate-[fadeUp_0.2s_ease-out]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
            Categories &amp; Budgets
          </h2>
          <p className="text-[11px] text-[#5B6670]">
            Customize categories and set optional monthly targets.
          </p>
        </div>

        {/* Type selector */}
        <div className="flex p-0.5 rounded-lg border border-[#10202B] bg-[#F1EEE6]">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`font-mono-code text-[11px] px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'expense'
                ? 'bg-[#10202B] text-white font-bold'
                : 'text-[#10202B]'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`font-mono-code text-[11px] px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'income'
                ? 'bg-[#10202B] text-white font-bold'
                : 'text-[#10202B]'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Add Category Button / Form */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-2 border border-dashed border-[#10202B] rounded-[10px] font-mono-code text-[11.5px] text-[#10202B] hover:bg-[#F1EEE6] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#2A7F73]" />
          <span>Add new {activeTab} category</span>
        </button>
      ) : (
        <div className="bg-[#F1EEE6] border-[1.5px] border-[#10202B] rounded-[12px] p-3.5 space-y-3 animate-[fadeUp_0.15s_ease-out]">
          <div className="text-[11px] font-mono-code uppercase font-bold text-[#10202B]">
            New {activeTab} Category
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Software & Subscriptions, Fitness..."
              autoFocus
              className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none"
            />
          </div>

          {/* Color Picker Palette */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Color Accent
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'border-[#10202B] scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Monthly Budget (Only for expense) */}
          {activeTab === 'expense' && (
            <div>
              <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
                Monthly Budget ({profile.currency_symbol}, Optional)
              </label>
              <input
                type="number"
                step="any"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none font-mono-code"
              />
            </div>
          )}

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
              onClick={handleAddCategory}
              className="text-[11px] font-mono-code font-bold px-4 py-1 rounded bg-[#10202B] text-white"
            >
              Create Category
            </button>
          </div>
        </div>
      )}

      {/* Category List Cards */}
      <div className="space-y-2">
        {filtered.map(cat => {
          const isEditing = editingCatId === cat.id;

          if (isEditing) {
            return (
              <div
                key={cat.id}
                className="p-3 rounded-[10px] border-[1.5px] border-[#10202B] bg-[#F1EEE6] space-y-2.5 animate-[fadeUp_0.15s_ease-out]"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 text-[13px] px-2.5 py-1 bg-white border border-[#10202B] rounded focus:outline-none font-medium"
                  />
                  {activeTab === 'expense' && (
                    <input
                      type="number"
                      step="any"
                      value={editBudget}
                      onChange={e => setEditBudget(e.target.value)}
                      placeholder="Budget..."
                      className="w-28 text-[12px] px-2 py-1 bg-white border border-[#10202B] rounded font-mono-code"
                    />
                  )}
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border ${
                        editColor === c ? 'border-[#10202B] scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingCatId(null)}
                    className="text-[10px] font-mono-code px-2.5 py-1 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(cat.id)}
                    className="text-[10px] font-mono-code font-bold px-3 py-1 rounded bg-[#10202B] text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cat.id}
              className="p-3 rounded-[10px] border border-[#DCD6C7] bg-white flex items-center justify-between gap-3 hover:border-[#10202B] transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate flex-1">
                <span
                  style={{ backgroundColor: cat.color }}
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                />
                <span className="font-semibold text-[13px] text-[#10202B] truncate">
                  {cat.name}
                </span>
                {cat.monthly_budget !== null && cat.monthly_budget !== undefined && (
                  <span className="font-mono-code text-[11px] text-[#2A7F73] bg-[#EBF7EE] px-2 py-0.5 rounded-full font-medium">
                    Budget: {formatCurrency(cat.monthly_budget, profile.currency, profile.currency_symbol)}/mo
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(cat)}
                  title="Edit category"
                  className="p-1 text-[#5B6670] hover:text-[#10202B]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id)}
                  title="Delete category"
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
};
