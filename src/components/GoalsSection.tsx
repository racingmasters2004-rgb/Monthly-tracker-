import React, { useState } from 'react';
import { Goal, GoalItem, GoalType } from '../types';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, ChevronDown } from 'lucide-react';

interface GoalsSectionProps {
  goals: Goal[];
  onUpdateGoals: (updated: Goal[]) => void;
  todayStr: string;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  onUpdateGoals,
  todayStr,
}) => {
  const [activeTab, setActiveTab] = useState<GoalType>('annual');

  // Time navigation state
  const refDate = new Date(todayStr + 'T00:00:00');
  const [currentYear, setCurrentYear] = useState<number>(refDate.getFullYear());
  const [currentQuarter, setCurrentQuarter] = useState<number>(Math.floor(refDate.getMonth() / 3) + 1);
  const [currentMonthYear, setCurrentMonthYear] = useState<{ year: number; month: number }>({
    year: refDate.getFullYear(),
    month: refDate.getMonth() + 1,
  });

  // Inline forms
  const [showAddGoal, setShowAddGoal] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState<string>('');

  const [activeAddSubGoalId, setActiveAddSubGoalId] = useState<string | null>(null);
  const [newSubGoalName, setNewSubGoalName] = useState<string>('');

  // Month navigation helpers
  const shiftMonth = (delta: number) => {
    setCurrentMonthYear(prev => {
      let { year, month } = prev;
      month += delta;
      if (month < 1) {
        month = 12;
        year--;
      } else if (month > 12) {
        month = 1;
        year++;
      }
      return { year, month };
    });
  };

  const goThisMonth = () => {
    setCurrentMonthYear({
      year: refDate.getFullYear(),
      month: refDate.getMonth() + 1,
    });
  };

  // Add Goal
  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoalTitle.trim(),
      type: activeTab,
      year: activeTab === 'monthly' ? currentMonthYear.year : currentYear,
      quarter: activeTab === 'quarterly' ? currentQuarter : undefined,
      month: activeTab === 'monthly' ? currentMonthYear.month : undefined,
      target_date: newGoalTargetDate || null,
      done: false,
      items: [],
    };

    onUpdateGoals([...goals, newGoal]);
    setNewGoalTitle('');
    setNewGoalTargetDate('');
    setShowAddGoal(false);
  };

  // Toggle monthly goal done
  const handleToggleMonthlyGoal = (goalId: string) => {
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, done: !g.done } : g
    );
    onUpdateGoals(updated);
  };

  // Add sub-goal item (for Annual & Quarterly)
  const handleAddSubGoalItem = (goalId: string) => {
    if (!newSubGoalName.trim()) return;
    const newItem: GoalItem = {
      id: `gi_${Date.now()}`,
      goal_id: goalId,
      name: newSubGoalName.trim(),
      done: false,
    };

    const updated = goals.map(g =>
      g.id === goalId ? { ...g, items: [...g.items, newItem] } : g
    );
    onUpdateGoals(updated);
    setNewSubGoalName('');
    setActiveAddSubGoalId(null);
  };

  // Toggle sub-goal item done
  const handleToggleSubGoalItem = (goalId: string, itemId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        items: g.items.map(it => (it.id === itemId ? { ...it, done: !it.done } : it)),
      };
    });
    onUpdateGoals(updated);
  };

  // Delete sub-goal item
  const handleDeleteSubGoalItem = (goalId: string, itemId: string) => {
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      return {
        ...g,
        items: g.items.filter(it => it.id !== itemId),
      };
    });
    onUpdateGoals(updated);
  };

  // Delete Goal
  const handleDeleteGoal = (goalId: string) => {
    if (!confirm('Delete this goal and its checklist items?')) return;
    onUpdateGoals(goals.filter(g => g.id !== goalId));
  };

  // Filter goals for active tab & current period
  const filteredGoals = goals.filter(g => {
    if (g.type !== activeTab) return false;
    if (activeTab === 'annual') return g.year === currentYear;
    if (activeTab === 'quarterly') return g.year === currentYear && g.quarter === currentQuarter;
    if (activeTab === 'monthly') {
      return g.year === currentMonthYear.year && g.month === currentMonthYear.month;
    }
    return true;
  });

  const monthLabel = new Date(currentMonthYear.year, currentMonthYear.month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
          Goals
        </h2>

        {/* Tab Switcher */}
        <div className="flex p-0.5 rounded-lg border border-[#10202B] bg-[#F1EEE6]">
          {(['annual', 'quarterly', 'monthly'] as GoalType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setActiveTab(t);
                setShowAddGoal(false);
              }}
              className={`font-mono-code text-[10.5px] px-2.5 py-1 rounded-md transition-all ${
                activeTab === t
                  ? 'bg-[#10202B] text-white font-bold shadow-xs'
                  : 'text-[#10202B] hover:text-[#2A7F73]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Period Navigation Bar */}
      <div className="bg-[#FBFAF7] border border-[#DCD6C7] rounded-[10px] p-2.5 flex items-center justify-between">
        {activeTab === 'annual' && (
          <>
            <button
              type="button"
              onClick={() => setCurrentYear(prev => prev - 1)}
              className="text-[11px] font-mono-code px-2 py-0.5 border border-[#DCD6C7] rounded hover:border-[#10202B]"
            >
              &lsaquo; {currentYear - 1}
            </button>
            <span className="font-disp font-bold text-[15px] text-[#10202B]">
              {currentYear} Annual Goals
            </span>
            <button
              type="button"
              onClick={() => setCurrentYear(prev => prev + 1)}
              className="text-[11px] font-mono-code px-2 py-0.5 border border-[#DCD6C7] rounded hover:border-[#10202B]"
            >
              {currentYear + 1} &rsaquo;
            </button>
          </>
        )}

        {activeTab === 'quarterly' && (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1 font-mono-code text-[11px]">
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev - 1)}
                className="px-1.5 py-0.5 border border-[#DCD6C7] rounded"
              >
                &lsaquo;
              </button>
              <span className="font-bold text-[#10202B] px-1">{currentYear}</span>
              <button
                type="button"
                onClick={() => setCurrentYear(prev => prev + 1)}
                className="px-1.5 py-0.5 border border-[#DCD6C7] rounded"
              >
                &rsaquo;
              </button>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setCurrentQuarter(q)}
                  className={`font-mono-code text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                    currentQuarter === q
                      ? 'bg-[#10202B] text-white border-[#10202B] font-bold'
                      : 'bg-white text-[#5B6670] border-[#DCD6C7]'
                  }`}
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="text-[11px] font-mono-code px-2 py-0.5 border border-[#DCD6C7] rounded"
            >
              &lsaquo; Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="font-disp font-bold text-[14px] text-[#10202B]">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={goThisMonth}
                className="text-[10px] font-mono-code px-1.5 py-0.5 border border-[#10202B] rounded text-[#10202B] hover:bg-[#F1EEE6]"
              >
                This month
              </button>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="text-[11px] font-mono-code px-2 py-0.5 border border-[#DCD6C7] rounded"
            >
              Next &rsaquo;
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Button */}
      {!showAddGoal ? (
        <button
          type="button"
          onClick={() => setShowAddGoal(true)}
          className="w-full py-1.5 border border-dashed border-[#10202B] rounded-[8px] font-mono-code text-[11px] text-[#10202B] hover:bg-[#F1EEE6] transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#2A7F73]" />
          <span>Add {activeTab} goal</span>
        </button>
      ) : (
        <div className="p-3 bg-[#F1EEE6] border border-[#10202B] rounded-[10px] space-y-2 animate-[fadeUp_0.15s_ease-out]">
          <div className="text-[10.5px] font-mono-code font-bold uppercase text-[#10202B]">
            New {activeTab} Goal
          </div>
          <input
            type="text"
            value={newGoalTitle}
            onChange={e => setNewGoalTitle(e.target.value)}
            placeholder="Goal title..."
            autoFocus
            className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded focus:outline-none"
          />
          {activeTab !== 'monthly' && (
            <div>
              <label className="text-[9.5px] font-mono-code text-[#5B6670] uppercase block mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={newGoalTargetDate}
                onChange={e => setNewGoalTargetDate(e.target.value)}
                className="w-full text-[11px] font-mono-code px-2 py-1 bg-white border border-[#10202B] rounded"
              />
            </div>
          )}
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAddGoal(false)}
              className="text-[10px] font-mono-code px-2.5 py-1 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddGoal}
              className="text-[10px] font-mono-code font-bold px-3 py-1 rounded bg-[#10202B] text-white"
            >
              Add Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals Content List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-6 text-[12px] text-[#5B6670] italic border border-dashed border-[#DCD6C7] rounded-[10px] bg-[#FBFAF7]">
          No goals set for this period. Tap '+ Add {activeTab} goal' to plan ahead!
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredGoals.map(g => {
            // Annual & Quarterly have checklist sub-goals
            if (activeTab === 'annual' || activeTab === 'quarterly') {
              const totalItems = g.items.length;
              const doneItems = g.items.filter(it => it.done).length;
              const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : null;

              return (
                <div
                  key={g.id}
                  className="p-3 rounded-[10px] border border-[#DCD6C7] bg-white hover:border-[#10202B] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[13.5px] text-[#10202B]">
                          {g.title}
                        </span>
                        <span className="font-mono-code text-[11px] font-bold text-[#2A7F73]">
                          {pct === null ? 'no sub-goals' : `${pct}%`}
                        </span>
                      </div>
                      {g.target_date && (
                        <span className="text-[10px] font-mono-code text-[#5B6670]">
                          Target: {g.target_date}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  {pct !== null && (
                    <div className="w-full h-1.5 bg-[#F1EEE6] rounded-full overflow-hidden mt-2">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-[#2A7F73] transition-all duration-500 ease-out"
                      />
                    </div>
                  )}

                  {/* Checklist Sub-goal Items */}
                  <div className="mt-2.5 pt-2 border-t border-[#F1EEE6] space-y-1.5">
                    {g.items.map(it => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between p-1.5 rounded bg-[#F1EEE6]/70 hover:bg-[#F1EEE6] text-[12px]"
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <button
                            type="button"
                            onClick={() => handleToggleSubGoalItem(g.id, it.id)}
                            className="w-4 h-4 rounded border border-[#10202B] flex items-center justify-center shrink-0 bg-white"
                          >
                            {it.done && <Check className="w-3 h-3 text-[#10202B]" />}
                          </button>
                          <span className={`truncate text-[#10202B] ${it.done ? 'line-through opacity-60' : ''}`}>
                            {it.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubGoalItem(g.id, it.id)}
                          className="text-[#5B6670] hover:text-[#C4331E] ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Add sub-goal inline */}
                    {activeAddSubGoalId !== g.id ? (
                      <button
                        type="button"
                        onClick={() => setActiveAddSubGoalId(g.id)}
                        className="font-mono-code text-[10px] text-[#2A7F73] hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add sub-goal</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          value={newSubGoalName}
                          onChange={e => setNewSubGoalName(e.target.value)}
                          placeholder="Sub-goal item..."
                          autoFocus
                          className="flex-1 text-[11px] px-2 py-1 bg-white border border-[#10202B] rounded"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddSubGoalItem(g.id);
                            if (e.key === 'Escape') setActiveAddSubGoalId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubGoalItem(g.id)}
                          className="text-[10px] font-mono-code bg-[#10202B] text-white px-2 py-1 rounded"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveAddSubGoalId(null)}
                          className="text-[10px] font-mono-code text-[#5B6670] px-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Monthly flat checklist goal
            return (
              <div
                key={g.id}
                className="p-2.5 rounded-[10px] border border-[#DCD6C7] bg-white flex items-center justify-between gap-2 text-[12.5px] hover:border-[#10202B] transition-colors"
              >
                <div className="flex items-center gap-2.5 flex-1 truncate">
                  <button
                    type="button"
                    onClick={() => handleToggleMonthlyGoal(g.id)}
                    className="w-4 h-4 rounded border border-[#10202B] flex items-center justify-center shrink-0 bg-white"
                  >
                    {g.done && <Check className="w-3 h-3 text-[#10202B]" />}
                  </button>
                  <span className={`truncate text-[#10202B] font-medium ${g.done ? 'line-through opacity-60' : ''}`}>
                    {g.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGoal(g.id)}
                  className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
