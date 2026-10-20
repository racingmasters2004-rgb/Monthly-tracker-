import React, { useState } from 'react';
import { Domain, Task, Subtask, Priority, FilterView, TaskStatus } from '../types';
import { domainScore, priorityWeight, normalizeTags, deadlineBucket } from '../utils/date';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Calendar,
  Tag,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  FileText,
  CornerDownRight
} from 'lucide-react';

interface DomainsListProps {
  domains: Domain[];
  onUpdateDomains: (updated: Domain[]) => void;
  todayStr: string;
  currentView: FilterView;
  selectedTag: string;
  searchQuery: string;
  onSubtaskCheck: (subtask: Subtask, parentTask: Task, willCompleteParent: boolean) => void;
  onSubtaskUncheck: (subtask: Subtask, parentTask: Task) => void;
  onOpenPdfModal: () => void;
  onExportJson: () => void;
}

export const DomainsList: React.FC<DomainsListProps> = ({
  domains,
  onUpdateDomains,
  todayStr,
  currentView,
  selectedTag,
  searchQuery,
  onSubtaskCheck,
  onSubtaskUncheck,
  onOpenPdfModal,
  onExportJson,
}) => {
  // Collapsed states
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});
  const [collapsedTasks, setCollapsedTasks] = useState<Record<string, boolean>>({});
  const [showCompletedTasks, setShowCompletedTasks] = useState<Record<string, boolean>>({});
  const [showCompletedSubs, setShowCompletedSubs] = useState<Record<string, boolean>>({});

  // Inline forms
  const [activeAddDomain, setActiveAddDomain] = useState<boolean>(false);
  const [newDomainName, setNewDomainName] = useState<string>('');

  const [activeAddTaskDomainId, setActiveAddTaskDomainId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskTags, setNewTaskTags] = useState<string>('');
  const [newTaskImportant, setNewTaskImportant] = useState<boolean>(false);
  const [newTaskUrgent, setNewTaskUrgent] = useState<boolean>(false);
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>(todayStr);
  const [newTaskBulkSubs, setNewTaskBulkSubs] = useState<string>('');

  // Inline Subtask Add form
  const [activeAddSubTaskId, setActiveAddSubTaskId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubPriority, setNewSubPriority] = useState<Priority>('medium');
  const [newSubDeadline, setNewSubDeadline] = useState<string>(todayStr);
  const [selectedSubTags, setSelectedSubTags] = useState<string[]>([]);
  const [newSubBulkLines, setNewSubBulkLines] = useState<string>('');
  const [isBulkSubMode, setIsBulkSubMode] = useState<boolean>(false);

  // Edit Task modal/inline
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Domain edit inline
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editDomainName, setEditDomainName] = useState<string>('');

  const toggleDomainCollapse = (domainId: string) => {
    setCollapsedDomains(prev => ({ ...prev, [domainId]: !prev[domainId] }));
  };

  const toggleTaskCollapse = (taskId: string) => {
    setCollapsedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Add Domain
  const handleAddDomain = () => {
    if (!newDomainName.trim()) return;
    const newDom: Domain = {
      id: `dom_${Date.now()}`,
      name: newDomainName.trim(),
      sort_order: domains.length + 1,
      tasks: [],
    };
    onUpdateDomains([...domains, newDom]);
    setNewDomainName('');
    setActiveAddDomain(false);
  };

  // Edit Domain Name
  const handleSaveDomainName = (domainId: string) => {
    if (!editDomainName.trim()) return;
    const updated = domains.map(d =>
      d.id === domainId ? { ...d, name: editDomainName.trim() } : d
    );
    onUpdateDomains(updated);
    setEditingDomainId(null);
  };

  // Delete Domain
  const handleDeleteDomain = (domainId: string) => {
    if (!confirm('Delete this domain and all its tasks?')) return;
    onUpdateDomains(domains.filter(d => d.id !== domainId));
  };

  // Add Task
  const handleAddTask = (domainId: string) => {
    if (!newTaskName.trim()) return;
    const taskId = `task_${Date.now()}`;
    const parsedTags = normalizeTags(newTaskTags);

    // Parse bulk subtasks if provided
    const initialSubs: Subtask[] = [];
    if (newTaskBulkSubs.trim()) {
      const lines = newTaskBulkSubs.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach((line, idx) => {
        initialSubs.push({
          id: `sub_${Date.now()}_${idx}`,
          task_id: taskId,
          name: line,
          priority: newTaskPriority,
          tags: parsedTags,
          deadline: newTaskDeadline || null,
          done: false,
          completed_at: null,
        });
      });
    }

    const newTask: Task = {
      id: taskId,
      domain_id: domainId,
      name: newTaskName.trim(),
      priority: newTaskPriority,
      tags: parsedTags,
      important: newTaskImportant,
      urgent: newTaskUrgent,
      status: 'active',
      deadline: newTaskDeadline || null,
      completed_at: null,
      created_at: new Date().toISOString(),
      subtasks: initialSubs,
    };

    const updated = domains.map(d =>
      d.id === domainId ? { ...d, tasks: [...d.tasks, newTask] } : d
    );
    onUpdateDomains(updated);

    // Reset form
    setNewTaskName('');
    setNewTaskTags('');
    setNewTaskBulkSubs('');
    setNewTaskPriority('medium');
    setNewTaskImportant(false);
    setNewTaskUrgent(false);
    setActiveAddTaskDomainId(null);
  };

  // Add Subtask
  const handleAddSubtask = (parentTask: Task) => {
    if (isBulkSubMode) {
      if (!newSubBulkLines.trim()) return;
      const lines = newSubBulkLines.split('\n').map(l => l.trim()).filter(Boolean);
      const newSubs: Subtask[] = lines.map((line, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        task_id: parentTask.id,
        name: line,
        priority: newSubPriority,
        tags: selectedSubTags,
        deadline: newSubDeadline || null,
        done: false,
        completed_at: null,
      }));

      const updated = domains.map(d => ({
        ...d,
        tasks: d.tasks.map(t =>
          t.id === parentTask.id ? { ...t, subtasks: [...t.subtasks, ...newSubs] } : t
        ),
      }));
      onUpdateDomains(updated);
      setNewSubBulkLines('');
      setIsBulkSubMode(false);
      setActiveAddSubTaskId(null);
      return;
    }

    if (!newSubName.trim()) return;
    const newSub: Subtask = {
      id: `sub_${Date.now()}`,
      task_id: parentTask.id,
      name: newSubName.trim(),
      priority: newSubPriority,
      tags: selectedSubTags,
      deadline: newSubDeadline || null,
      done: false,
      completed_at: null,
    };

    const updated = domains.map(d => ({
      ...d,
      tasks: d.tasks.map(t =>
        t.id === parentTask.id ? { ...t, subtasks: [...t.subtasks, newSub] } : t
      ),
    }));
    onUpdateDomains(updated);
    setNewSubName('');
    setSelectedSubTags([]);
    setActiveAddSubTaskId(null);
  };

  // Toggle Subtask Done
  const handleToggleSubtask = (parentTask: Task, subtask: Subtask) => {
    const isNowDone = !subtask.done;
    const otherOpenSubs = parentTask.subtasks.filter(s => s.id !== subtask.id && !s.done);
    const willCompleteParent = isNowDone && otherOpenSubs.length === 0;

    if (isNowDone) {
      onSubtaskCheck(subtask, parentTask, willCompleteParent);
    } else {
      onSubtaskUncheck(subtask, parentTask);
    }

    const updated = domains.map(d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id !== parentTask.id) return t;
        const updatedSubs = t.subtasks.map(s =>
          s.id === subtask.id
            ? { ...s, done: isNowDone, completed_at: isNowDone ? new Date().toISOString() : null }
            : s
        );

        let newStatus: TaskStatus = t.status;
        let newCompletedAt = t.completed_at;

        if (willCompleteParent) {
          newStatus = 'done';
          newCompletedAt = new Date().toISOString();
        } else if (!isNowDone && t.status === 'done') {
          // Unchecking a subtask re-opens parent
          newStatus = 'active';
          newCompletedAt = null;
        }

        return { ...t, subtasks: updatedSubs, status: newStatus, completed_at: newCompletedAt };
      }),
    }));

    onUpdateDomains(updated);
  };

  // Standalone task toggle
  const handleToggleTask = (task: Task) => {
    const isNowDone = task.status !== 'done';
    const newStatus: TaskStatus = isNowDone ? 'done' : 'active';
    const updated = domains.map(d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id !== task.id) return t;
        return {
          ...t,
          status: newStatus,
          completed_at: isNowDone ? new Date().toISOString() : null,
          subtasks: t.subtasks.map(s => ({
            ...s,
            done: isNowDone,
            completed_at: isNowDone ? (s.completed_at || new Date().toISOString()) : null,
          })),
        };
      }),
    }));
    onUpdateDomains(updated);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    const updated = domains.map(d => ({
      ...d,
      tasks: d.tasks.filter(t => t.id !== taskId),
    }));
    onUpdateDomains(updated);
  };

  // Delete Subtask
  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const updated = domains.map(d => ({
      ...d,
      tasks: d.tasks.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter(s => s.id !== subtaskId),
        };
      }),
    }));
    onUpdateDomains(updated);
  };

  // Filter predicates
  const taskMatchesFilter = (task: Task): boolean => {
    // Tag filter
    if (selectedTag) {
      const taskHasTag = task.tags.includes(selectedTag);
      const subHasTag = task.subtasks.some(s => s.tags.includes(selectedTag));
      if (!taskHasTag && !subHasTag) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = task.name.toLowerCase().includes(q);
      const matchTag = task.tags.some(t => t.toLowerCase().includes(q));
      const matchSubs = task.subtasks.some(
        s => s.name.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q))
      );
      if (!matchName && !matchTag && !matchSubs) return false;
    }

    // View bucket filter
    if (currentView === 'all') return true;
    if (currentView === 'done') return task.status === 'done';

    // If done, only shows in 'done' or 'all'
    if (task.status === 'done') return false;

    // Check task deadline or any open subtask deadline
    const taskBucket = deadlineBucket(task.deadline, false, todayStr);
    if (currentView === 'today' && taskBucket === 'today') return true;
    if (currentView === 'tomorrow' && taskBucket === 'tomorrow') return true;
    if (currentView === 'overdue' && taskBucket === 'overdue') return true;
    if (currentView === 'week' && (taskBucket === 'today' || taskBucket === 'tomorrow' || taskBucket === 'overdue' || taskBucket === 'week')) return true;

    // Check subtasks
    return task.subtasks.some(s => {
      if (s.done) return false;
      const subBucket = deadlineBucket(s.deadline, false, todayStr);
      if (currentView === 'today') return subBucket === 'today';
      if (currentView === 'tomorrow') return subBucket === 'tomorrow';
      if (currentView === 'overdue') return subBucket === 'overdue';
      if (currentView === 'week') return subBucket === 'today' || subBucket === 'tomorrow' || subBucket === 'overdue' || subBucket === 'week';
      return false;
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Domains Header with PDF & JSON Export buttons */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-disp font-bold text-[17px] text-[#10202B]">
          Domains
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onExportJson}
            title="Download JSON data backup"
            className="font-mono-code text-[11px] px-2 py-1 rounded border border-[#10202B] text-[#10202B] hover:bg-[#F1EEE6] transition-colors"
          >
            ↓ JSON
          </button>
          <button
            type="button"
            onClick={onOpenPdfModal}
            title="Export clean PDF report"
            className="font-mono-code text-[11px] px-2 py-1 rounded border border-[#10202B] text-[#10202B] hover:bg-[#F1EEE6] transition-colors"
          >
            📄 PDF Report
          </button>
          <button
            type="button"
            onClick={() => setActiveAddDomain(true)}
            className="font-mono-code text-[11px] font-semibold px-2.5 py-1 rounded bg-[#10202B] text-[#FBFAF7] hover:bg-[#1F3A52] active:scale-95 transition-all"
          >
            + Add Domain
          </button>
        </div>
      </div>

      {/* Inline Add Domain Form */}
      {activeAddDomain && (
        <div className="bg-[#F1EEE6] border-[1.5px] border-[#10202B] rounded-[10px] p-3 animate-[fadeUp_0.2s_ease-out]">
          <label className="block text-[11px] font-mono-code text-[#5B6670] uppercase font-semibold mb-1">
            Domain Name
          </label>
          <input
            type="text"
            value={newDomainName}
            onChange={e => setNewDomainName(e.target.value)}
            placeholder="e.g. Company / Client Operations, Personal, Health..."
            autoFocus
            className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none focus:border-[#2A7F73] mb-2.5"
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddDomain();
              if (e.key === 'Escape') setActiveAddDomain(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveAddDomain(false)}
              className="text-[11px] font-mono-code px-3 py-1 rounded border border-[#DCD6C7] hover:bg-white text-[#5B6670]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddDomain}
              className="text-[11px] font-mono-code font-bold px-3 py-1 rounded bg-[#10202B] text-[#FBFAF7] hover:bg-[#1F3A52]"
            >
              Create Domain
            </button>
          </div>
        </div>
      )}

      {/* Domain Cards */}
      {domains.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-[#DCD6C7] rounded-[12px] bg-[#FBFAF7]">
          <p className="text-[13px] text-[#5B6670] italic mb-2">No domains yet.</p>
          <button
            type="button"
            onClick={() => setActiveAddDomain(true)}
            className="text-[12px] font-mono-code font-bold text-[#2A7F73] underline"
          >
            Create your first domain
          </button>
        </div>
      ) : (
        domains.map((domain, domainIndex) => {
          const isCollapsed = Boolean(collapsedDomains[domain.id]);
          const score = domainScore(domain.tasks);
          const visibleTasks = domain.tasks.filter(taskMatchesFilter);
          const activeTasks = visibleTasks.filter(t => t.status !== 'done');
          const completedTasks = visibleTasks.filter(t => t.status === 'done');
          const isAddingTask = activeAddTaskDomainId === domain.id;

          return (
            <div
              key={domain.id}
              className="border-[1.5px] border-[#10202B] rounded-[14px] bg-[#FBFAF7] overflow-hidden shadow-sm"
            >
              {/* Domain Header Row */}
              <div
                onClick={() => toggleDomainCollapse(domain.id)}
                className="bg-[#F1EEE6] px-3.5 py-2.5 flex items-center justify-between cursor-pointer border-b border-[#DCD6C7] select-none hover:bg-[#EAE6DC] transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[#10202B]">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>

                  {editingDomainId === domain.id ? (
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editDomainName}
                        onChange={e => setEditDomainName(e.target.value)}
                        className="text-[14px] font-bold px-2 py-0.5 border border-[#10202B] rounded bg-white text-[#10202B]"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveDomainName(domain.id);
                          if (e.key === 'Escape') setEditingDomainId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveDomainName(domain.id)}
                        className="text-[10px] font-mono-code bg-[#10202B] text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <span className="font-disp font-bold text-[15px] text-[#10202B] truncate">
                      {domain.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Domain score badge */}
                  <span
                    title="Weighted Domain Score"
                    className="font-mono-code text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBFAF7] border border-[#10202B] text-[#2A7F73]"
                  >
                    {score === null ? '—' : `${score}%`}
                  </span>

                  {/* Edit / Delete actions */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDomainId(domain.id);
                      setEditDomainName(domain.name);
                    }}
                    title="Rename domain"
                    className="p-1 text-[#5B6670] hover:text-[#10202B]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDomain(domain.id)}
                    title="Delete domain"
                    className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Domain Content */}
              {!isCollapsed && (
                <div className="p-3 sm:p-3.5 space-y-3">
                  {/* Active Tasks List */}
                  {activeTasks.length === 0 && completedTasks.length === 0 ? (
                    <div className="text-center py-4 text-[12px] text-[#5B6670] italic">
                      No matching tasks in this view.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeTasks.map(task => {
                        const isTaskCollapsed = Boolean(collapsedTasks[task.id]);
                        const totalSubs = task.subtasks.length;
                        const doneSubs = task.subtasks.filter(s => s.done).length;
                        const progressPct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
                        const isStalled = Boolean(task.idle);

                        // Near deadline highlight
                        const bucket = deadlineBucket(task.deadline, false, todayStr);
                        const isOverdue = bucket === 'overdue';
                        const isToday = bucket === 'today';

                        const openSubtasks = task.subtasks.filter(s => !s.done);
                        const completedSubtasks = task.subtasks.filter(s => s.done);
                        const showCompletedSubList = Boolean(showCompletedSubs[task.id]);

                        return (
                          <div
                            key={task.id}
                            id={`task-${task.id}`}
                            className={`border rounded-[10px] bg-white transition-all ${
                              isStalled ? 'border-[#C4331E]' : 'border-[#DCD6C7] hover:border-[#10202B]'
                            }`}
                          >
                            {/* Task Top Bar */}
                            <div className="p-2.5 sm:p-3 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                {/* Task Checkbox (for standalone tasks with no subtasks) */}
                                {totalSubs === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTask(task)}
                                    className="mt-0.5 w-5 h-5 rounded border-[1.5px] border-[#10202B] flex items-center justify-center shrink-0 hover:bg-[#F1EEE6] transition-colors"
                                  >
                                    {task.status === 'done' && <Check className="w-3.5 h-3.5 text-[#10202B]" />}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskCollapse(task.id)}
                                    className="mt-0.5 text-[#5B6670] hover:text-[#10202B] shrink-0"
                                  >
                                    {isTaskCollapsed ? (
                                      <ChevronRight className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                )}

                                <div className="flex-1 min-w-0">
                                  {/* Title + Priority dot */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`prio-dot ${task.priority}`} title={`Priority: ${task.priority}`} />
                                    <span className={`text-[13.5px] font-semibold text-[#10202B] break-words ${
                                      task.status === 'done' ? 'line-through opacity-60' : ''
                                    }`}>
                                      {task.name}
                                    </span>
                                  </div>

                                  {/* Meta: Tags, Eisenhower, Deadline */}
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px] font-mono-code">
                                    {/* Eisenhower Quadrant Pill */}
                                    {(task.important || task.urgent) && (
                                      <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                        task.important && task.urgent
                                          ? 'bg-[#FBE4E0] text-[#C4331E]'
                                          : task.important
                                          ? 'bg-[#DDEBF6] text-[#2A6FA3]'
                                          : 'bg-[#FBF1D6] text-[#8A6D00]'
                                      }`}>
                                        {task.important && task.urgent ? 'Do Now' : task.important ? 'Plan It' : 'Delegate'}
                                      </span>
                                    )}

                                    {/* Deadline badge */}
                                    {task.deadline && (
                                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                                        isOverdue
                                          ? 'bg-[#FDECEA] text-[#C4331E] font-bold'
                                          : isToday
                                          ? 'bg-[#FFF3D6] text-[#B8860B] font-bold'
                                          : 'bg-[#F1EEE6] text-[#5B6670]'
                                      }`}>
                                        <Calendar className="w-2.5 h-2.5" />
                                        <span>{task.deadline}</span>
                                      </span>
                                    )}

                                    {/* Tags */}
                                    {task.tags.map(tag => (
                                      <span
                                        key={tag}
                                        className="bg-[#F1EEE6] text-[#10202B] px-1.5 py-0.5 rounded text-[9.5px] font-medium"
                                      >
                                        #{tag}
                                      </span>
                                    ))}

                                    {/* Stalled pill */}
                                    {isStalled && (
                                      <span className="bg-[#C4331E] text-white px-1.5 py-0.5 rounded font-bold tracking-wide">
                                        STALLED (3D+)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right side: Subtask count & actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                {totalSubs > 0 && (
                                  <span className="font-mono-code text-[10px] font-semibold text-[#5B6670] bg-[#F1EEE6] px-1.5 py-0.5 rounded">
                                    {doneSubs}/{totalSubs}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Delete task"
                                  className="p-1 text-[#5B6670] hover:text-[#C4331E]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Animated progress bar: empty->full, red->amber->green */}
                            {totalSubs > 0 && (
                              <div className="w-full h-1 bg-[#F1EEE6] overflow-hidden">
                                <div
                                  style={{ width: `${progressPct}%` }}
                                  className={`h-full transition-all duration-500 ease-out ${
                                    progressPct >= 100
                                      ? 'bg-[#4C8557]'
                                      : progressPct >= 50
                                      ? 'bg-[#D9A017]'
                                      : 'bg-[#D9531E]'
                                  }`}
                                />
                              </div>
                            )}

                            {/* Subtasks Section */}
                            {!isTaskCollapsed && totalSubs > 0 && (
                              <div className="px-3 pt-2 pb-2.5 border-t border-[#F1EEE6] bg-[#FBFAF7]/70 space-y-1.5">
                                {/* Open Subtasks */}
                                {openSubtasks.map(sub => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-[#F1EEE6] text-[12.5px] transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleSubtask(task, sub)}
                                        className="w-4 h-4 rounded border border-[#10202B] flex items-center justify-center shrink-0 hover:bg-white transition-colors"
                                      >
                                        {sub.done && <Check className="w-3 h-3 text-[#10202B]" />}
                                      </button>
                                      <span className={`prio-dot ${sub.priority}`} />
                                      <span className="text-[#10202B] truncate flex-1">
                                        {sub.name}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 text-[9.5px] font-mono-code text-[#5B6670]">
                                      {sub.deadline && (
                                        <span>{sub.deadline}</span>
                                      )}
                                      {sub.tags.map(t => (
                                        <span key={t} className="bg-white px-1 rounded border border-[#DCD6C7]">
                                          #{t}
                                        </span>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                        className="text-[#5B6670] hover:text-[#C4331E] ml-1"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                ))}

                                {/* Collapsible Completed Subtasks */}
                                {completedSubtasks.length > 0 && (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowCompletedSubs(prev => ({
                                          ...prev,
                                          [task.id]: !prev[task.id],
                                        }))
                                      }
                                      className="font-mono-code text-[10px] text-[#5B6670] hover:text-[#10202B] flex items-center gap-1 py-1"
                                    >
                                      {showCompletedSubList ? (
                                        <ChevronDown className="w-3 h-3" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3" />
                                      )}
                                      <span>
                                        Completed subtasks ({completedSubtasks.length})
                                      </span>
                                    </button>

                                    {showCompletedSubList && (
                                      <div className="space-y-1 pl-2 border-l border-[#DCD6C7] mt-1">
                                        {completedSubtasks.map(sub => (
                                          <div
                                            key={sub.id}
                                            className="flex items-center justify-between gap-2 p-1 text-[11.5px] opacity-60 hover:opacity-100 transition-opacity"
                                          >
                                            <div className="flex items-center gap-2 flex-1 truncate">
                                              <button
                                                type="button"
                                                onClick={() => handleToggleSubtask(task, sub)}
                                                className="w-4 h-4 rounded border border-[#10202B] bg-[#10202B] flex items-center justify-center shrink-0"
                                              >
                                                <Check className="w-3 h-3 text-[#FBFAF7]" />
                                              </button>
                                              <span className="line-through text-[#10202B] truncate">
                                                {sub.name}
                                              </span>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteSubtask(task.id, sub.id)}
                                              className="text-[#5B6670] hover:text-[#C4331E]"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Add subtask inline button */}
                                {activeAddSubTaskId !== task.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveAddSubTaskId(task.id);
                                      setNewSubDeadline(task.deadline || todayStr);
                                      setSelectedSubTags([]);
                                    }}
                                    className="font-mono-code text-[10.5px] text-[#2A7F73] hover:underline flex items-center gap-1 pt-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add subtask</span>
                                  </button>
                                )}

                                {/* Add subtask inline form */}
                                {activeAddSubTaskId === task.id && (
                                  <div className="mt-2 p-2.5 rounded-lg border border-[#DCD6C7] bg-[#F1EEE6] animate-[fadeUp_0.15s_ease-out]">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-mono-code text-[10px] uppercase font-bold text-[#10202B]">
                                        New Subtask
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setIsBulkSubMode(prev => !prev)}
                                        className="text-[10px] font-mono-code text-[#2A7F73] underline"
                                      >
                                        {isBulkSubMode ? 'Single subtask' : 'Bulk add (multi-line)'}
                                      </button>
                                    </div>

                                    {isBulkSubMode ? (
                                      <textarea
                                        value={newSubBulkLines}
                                        onChange={e => setNewSubBulkLines(e.target.value)}
                                        placeholder="Type one subtask per line...&#10;Subtask 1&#10;Subtask 2"
                                        rows={3}
                                        className="w-full text-[12px] p-2 bg-white border border-[#10202B] rounded mb-2 focus:outline-none"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={newSubName}
                                        onChange={e => setNewSubName(e.target.value)}
                                        placeholder="Subtask name..."
                                        autoFocus
                                        className="w-full text-[12px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded mb-2 focus:outline-none"
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleAddSubtask(task);
                                          if (e.key === 'Escape') setActiveAddSubTaskId(null);
                                        }}
                                      />
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mb-2 text-[11px] font-mono-code">
                                      <div>
                                        <label className="text-[9.5px] text-[#5B6670] uppercase block">
                                          Priority
                                        </label>
                                        <select
                                          value={newSubPriority}
                                          onChange={e => setNewSubPriority(e.target.value as Priority)}
                                          className="w-full bg-white border border-[#10202B] rounded px-2 py-1 text-[11px]"
                                        >
                                          <option value="high">High (2.0x)</option>
                                          <option value="medium">Medium (1.5x)</option>
                                          <option value="low">Low (1.0x)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[9.5px] text-[#5B6670] uppercase block">
                                          Deadline
                                        </label>
                                        <input
                                          type="date"
                                          value={newSubDeadline}
                                          onChange={e => setNewSubDeadline(e.target.value)}
                                          className="w-full bg-white border border-[#10202B] rounded px-1.5 py-1 text-[11px]"
                                        />
                                      </div>
                                    </div>

                                    {/* Subtask tag selector: MUST only choose from parent task's tags */}
                                    {task.tags.length > 0 && (
                                      <div className="mb-2">
                                        <label className="text-[9.5px] font-mono-code text-[#5B6670] uppercase block mb-1">
                                          Parent Task Tags (Check to assign)
                                        </label>
                                        <div className="flex flex-wrap gap-1">
                                          {task.tags.map(t => {
                                            const isSelected = selectedSubTags.includes(t);
                                            return (
                                              <button
                                                key={t}
                                                type="button"
                                                onClick={() =>
                                                  setSelectedSubTags(prev =>
                                                    isSelected ? prev.filter(x => x !== t) : [...prev, t]
                                                  )
                                                }
                                                className={`text-[9.5px] font-mono-code px-2 py-0.5 rounded border transition-colors ${
                                                  isSelected
                                                    ? 'bg-[#10202B] text-white border-[#10202B]'
                                                    : 'bg-white text-[#10202B] border-[#DCD6C7]'
                                                }`}
                                              >
                                                #{t}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex justify-end gap-1.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setActiveAddSubTaskId(null)}
                                        className="text-[10px] font-mono-code px-2.5 py-1 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubtask(task)}
                                        className="text-[10px] font-mono-code font-bold px-3 py-1 rounded bg-[#10202B] text-white"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Collapsed Completed Tasks List */}
                  {completedTasks.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setShowCompletedTasks(prev => ({
                            ...prev,
                            [domain.id]: !prev[domain.id],
                          }))
                        }
                        className="font-mono-code text-[11px] text-[#5B6670] hover:text-[#10202B] flex items-center gap-1.5 py-1"
                      >
                        {showCompletedTasks[domain.id] ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          Completed tasks in {domain.name} ({completedTasks.length})
                        </span>
                      </button>

                      {showCompletedTasks[domain.id] && (
                        <div className="space-y-1.5 mt-2 pl-2 border-l-2 border-[#DCD6C7]">
                          {completedTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-2 rounded-lg bg-[#F1EEE6]/60 border border-[#DCD6C7] flex items-center justify-between text-[12px] opacity-75 hover:opacity-100 transition-opacity"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task)}
                                  className="w-4 h-4 rounded border border-[#10202B] bg-[#10202B] flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-3 h-3 text-[#FBFAF7]" />
                                </button>
                                <span className="line-through text-[#10202B] truncate font-medium">
                                  {task.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-[#5B6670] hover:text-[#C4331E] ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* "+ Add Task" button opens form in place at this domain */}
                  {!isAddingTask ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAddTaskDomainId(domain.id);
                        setNewTaskDeadline(todayStr);
                      }}
                      className="w-full py-2 border border-dashed border-[#10202B] rounded-[8px] font-mono-code text-[11.5px] text-[#10202B] hover:bg-[#F1EEE6] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#2A7F73]" />
                      <span>Add task in {domain.name}</span>
                    </button>
                  ) : (
                    /* In-place Combined Task Creation Form */
                    <div className="p-3.5 rounded-[10px] border-[1.5px] border-[#10202B] bg-[#F1EEE6] animate-[fadeUp_0.2s_ease-out] space-y-3">
                      <div className="text-[11px] font-mono-code uppercase font-bold text-[#10202B]">
                        New Task &middot; {domain.name}
                      </div>

                      {/* Task Name */}
                      <div>
                        <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
                          Task Name *
                        </label>
                        <input
                          type="text"
                          value={newTaskName}
                          onChange={e => setNewTaskName(e.target.value)}
                          placeholder="e.g. Prepare Q4 Financial Model..."
                          autoFocus
                          className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none focus:border-[#2A7F73]"
                        />
                      </div>

                      {/* Priority & Deadline row */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                        <div>
                          <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                            Priority
                          </label>
                          <select
                            value={newTaskPriority}
                            onChange={e => setNewTaskPriority(e.target.value as Priority)}
                            className="w-full bg-white border border-[#10202B] rounded-md px-2 py-1.5 text-[12px]"
                          >
                            <option value="high">High (2.0x weight)</option>
                            <option value="medium">Medium (1.5x weight)</option>
                            <option value="low">Low (1.0x weight)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#5B6670] uppercase block mb-1">
                            Deadline
                          </label>
                          <input
                            type="date"
                            value={newTaskDeadline}
                            onChange={e => setNewTaskDeadline(e.target.value)}
                            className="w-full bg-white border border-[#10202B] rounded-md px-2 py-1 text-[12px]"
                          />
                        </div>
                      </div>

                      {/* Eisenhower Matrix Toggles */}
                      <div className="flex items-center gap-4 py-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-medium text-[#10202B]">
                          <input
                            type="checkbox"
                            checked={newTaskImportant}
                            onChange={e => setNewTaskImportant(e.target.checked)}
                            className="w-4 h-4 rounded text-[#10202B]"
                          />
                          <span>Important</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[12px] font-medium text-[#10202B]">
                          <input
                            type="checkbox"
                            checked={newTaskUrgent}
                            onChange={e => setNewTaskUrgent(e.target.checked)}
                            className="w-4 h-4 rounded text-[#10202B]"
                          />
                          <span>Urgent</span>
                        </label>
                      </div>

                      {/* Tags (uppercase normalized) */}
                      <div>
                        <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
                          Tags (comma-separated, auto-uppercased)
                        </label>
                        <input
                          type="text"
                          value={newTaskTags}
                          onChange={e => setNewTaskTags(e.target.value)}
                          placeholder="e.g. CLIENTS, NAYAN SIR, STRATEGY"
                          className="w-full text-[12px] px-3 py-1.5 bg-white border border-[#10202B] rounded-md focus:outline-none"
                        />
                      </div>

                      {/* Optional Bulk Subtasks */}
                      <div>
                        <label className="text-[10px] font-mono-code text-[#5B6670] uppercase block mb-1">
                          Initial Subtasks (Optional &mdash; one per line)
                        </label>
                        <textarea
                          value={newTaskBulkSubs}
                          onChange={e => setNewTaskBulkSubs(e.target.value)}
                          placeholder="Review deliverables&#10;Send client invoice&#10;Follow up confirmation"
                          rows={3}
                          className="w-full text-[12px] p-2 bg-white border border-[#10202B] rounded-md focus:outline-none font-sans"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveAddTaskDomainId(null)}
                          className="text-[11px] font-mono-code px-3 py-1.5 rounded border border-[#DCD6C7] bg-white text-[#5B6670]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTask(domain.id)}
                          className="text-[11px] font-mono-code font-bold px-4 py-1.5 rounded bg-[#10202B] text-white hover:bg-[#1F3A52]"
                        >
                          Save Task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
