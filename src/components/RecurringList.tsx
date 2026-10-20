import React, { useState } from 'react';
import { Domain, RecurringTemplate, Priority } from '../types';
import { calculateStreak, normalizeTags } from '../utils/date';
import { Plus, Flame, Check, Trash2, Calendar, Repeat } from 'lucide-react';

interface RecurringListProps {
  recurring: RecurringTemplate[];
  domains: Domain[];
  todayStr: string;
  onUpdateRecurring: (updated: RecurringTemplate[]) => void;
}

export const RecurringList: React.FC<RecurringListProps> = ({
  recurring,
  domains,
  todayStr,
  onUpdateRecurring,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [domainId, setDomainId] = useState<string>(domains[0]?.id || '');
  const [targetTaskId, setTargetTaskId] = useState<string>('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [priority, setPriority] = useState<Priority>('medium');
  const [tags, setTags] = useState<string>('');
  const [important, setImportant] = useState<boolean>(false);
  const [urgent, setUrgent] = useState<boolean>(false);

  // Flatten tasks and subtasks for streak calculation
  const allTasks = domains.flatMap(d => d.tasks);
  const allSubtasks = allTasks.flatMap(t => t.subtasks);

  const weekdayLabels = [
    { day: 0, label: 'Sun' },
    { day: 1, label: 'Mon' },
    { day: 2, label: 'Tue' },
    { day: 3, label: 'Wed' },
    { day: 4, label: 'Thu' },
    { day: 5, label: 'Fri' },
    { day: 6, label: 'Sat' },
  ];

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleAddTemplate = () => {
    if (!name.trim()) return;

    const tpl: RecurringTemplate = {
      id: `rec_${Date.now()}`,
      name: name.trim(),
      domain_id: domainId || (domains[0]?.id ?? 'dom_1'),
      task_id: targetTaskId.trim() ? targetTaskId : null,
      frequency: frequency,
      weekdays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedWeekdays,
      priority,
      tags: normalizeTags(tags),
      important,
      urgent,
      active: true,
      streak: 0,
    };

    onUpdateRecurring([...recurring, tpl]);

    // Reset form
    setName('');
    setTags('');
    setTargetTaskId('');
    setShowAddForm(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = recurring.map(r => (r.id === id ? { ...r, active: !r.active } : r));
    onUpdateRecurring(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this recurring habit template?')) return;
    onUpdateRecurring(recurring.filter(r => r.id !== id));
  };

  // Available tasks in selected domain for subtask target
  const domainTasks = domains.find(d => d.id === domainId)?.tasks || [];

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-disp font-bold text-[17px] text-[#10202B] flex items-center gap-1.5">
          <span>Recurring habits &amp; tasks</span>
        </h2>
        <button
          type="button"
          onClick={() => setShowAddForm(prev => !prev)}
          className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded bg-[#10202B] text-[#FBFAF7] hover:bg-[#1F3A52] active:scale-95 transition-all"
        >
          {showAddForm ? 'Close' : '+ Add Habit'}
        </button>
      </div>

      {/* Add Recurring Template Form */}
      {showAddForm && (
        <div className="bg-[#F1EEE6] border-[1.5px] border-[#10202B] rounded-[10px] p-3.5 space-y-3 animate-[fadeUp_0.2s_ease-out]">
          <div className="text-[11px] font-mono-code uppercase font-bold text-[#10202B]">
            New Recurring Template
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Habit / Task Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Daily Market Briefing, Workout, LinkedIn post..."
              autoFocus
              className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none"
            />
          </div>

          {/* Domain & Target Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono-code">
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Domain
              </label>
              <select
                value={domainId}
                onChange={e => {
                  setDomainId(e.target.value);
                  setTargetTaskId('');
                }}
                className="w-full bg-white border border-[#10202B] rounded-md px-2 py-1.5 text-[12px]"
              >
                {domains.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Target Task (Optional &rarr; Creates Subtask)
              </label>
              <select
                value={targetTaskId}
                onChange={e => setTargetTaskId(e.target.value)}
                className="w-full bg-white border border-[#10202B] rounded-md px-2 py-1.5 text-[12px]"
              >
                <option value="">None (Create standalone task)</option>
                {domainTasks.map(t => (
                  <option key={t.id} value={t.id}>
                    ↳ Under: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Frequency & Weekdays */}
          <div>
            <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
              Schedule Frequency
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setFrequency('daily');
                  setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
                }}
                className={`font-mono-code text-[11px] px-3 py-1 rounded border transition-colors ${
                  frequency === 'daily'
                    ? 'bg-[#10202B] text-white border-[#10202B]'
                    : 'bg-white text-[#10202B] border-[#DCD6C7]'
                }`}
              >
                Daily (7 days)
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`font-mono-code text-[11px] px-3 py-1 rounded border transition-colors ${
                  frequency === 'weekly'
                    ? 'bg-[#10202B] text-white border-[#10202B]'
                    : 'bg-white text-[#10202B] border-[#DCD6C7]'
                }`}
              >
                Chosen Weekdays
              </button>
            </div>

            {frequency === 'weekly' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {weekdayLabels.map(({ day, label }) => {
                  const isChecked = selectedWeekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`font-mono-code text-[10.5px] px-2.5 py-1 rounded-full border transition-all ${
                        isChecked
                          ? 'bg-[#10202B] text-white border-[#10202B] font-bold'
                          : 'bg-white text-[#5B6670] border-[#DCD6C7]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority & Tags */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-white border border-[#10202B] rounded-md px-2 py-1.5 text-[12px]"
              >
                <option value="high">High (2.0x)</option>
                <option value="medium">Medium (1.5x)</option>
                <option value="low">Low (1.0x)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="ROUTINE, HABIT..."
                className="w-full text-[12px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[11px] font-mono-code px-3 py-1.5 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddTemplate}
              className="text-[11px] font-mono-code font-bold px-4 py-1.5 rounded bg-[#10202B] text-white hover:bg-[#1F3A52]"
            >
              Save Habit
            </button>
          </div>
        </div>
      )}

      {/* Recurring Templates List */}
      {recurring.length === 0 ? (
        <div className="text-center py-5 border border-dashed border-[#DCD6C7] rounded-[10px] bg-[#FBFAF7] text-[12px] text-[#5B6670] italic">
          No recurring templates created. Tap '+ Add Habit' to build consistent streaks!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {recurring.map(tpl => {
            const streak = calculateStreak(tpl, allSubtasks, allTasks, todayStr);
            const domainName = domains.find(d => d.id === tpl.domain_id)?.name || 'General';
            const isSubtaskGen = Boolean(tpl.task_id);

            const dayString =
              tpl.frequency === 'daily' || tpl.weekdays.length === 7
                ? 'Daily'
                : tpl.weekdays
                    .map(d => weekdayLabels.find(w => w.day === d)?.label)
                    .filter(Boolean)
                    .join(', ');

            return (
              <div
                key={tpl.id}
                className={`p-3 rounded-[10px] border-[1.5px] bg-white transition-all flex flex-col justify-between ${
                  tpl.active ? 'border-[#10202B]' : 'border-[#DCD6C7] opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`prio-dot ${tpl.priority}`} />
                      <span className="font-semibold text-[13px] text-[#10202B] leading-tight">
                        {tpl.name}
                      </span>
                    </div>

                    {/* Active toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(tpl.id)}
                      className={`font-mono-code text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        tpl.active
                          ? 'bg-[#EBF7EE] text-[#4C8557] border-[#4C8557]'
                          : 'bg-[#F1EEE6] text-[#5B6670] border-[#DCD6C7]'
                      }`}
                    >
                      {tpl.active ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="text-[10px] font-mono-code text-[#5B6670] space-y-0.5">
                    <div>
                      <span>Schedule: </span>
                      <span className="font-semibold text-[#10202B]">{dayString}</span>
                    </div>
                    <div>
                      <span>Destination: </span>
                      <span className="text-[#10202B]">
                        {domainName}
                        {isSubtaskGen && ' (↳ Subtask)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom row: Streak badge & delete */}
                <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#F1EEE6]">
                  <div className="flex items-center gap-1 font-mono-code text-[11px] font-bold text-[#B8611A] bg-[#FFF1DE] border border-[#E8CB6E] px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 text-[#D9531E]" />
                    <span>{streak} day streak</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(tpl.id)}
                    title="Delete template"
                    className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
