import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Domain,
  Task,
  Subtask,
  RecurringTemplate,
  Goal,
  JournalEntry,
  Transaction,
  ExpenseCategory,
  PaymentMethod,
  ExpenseRecurringTemplate,
  UserProfile,
  FilterView,
  MainTab,
  ExpenseSubTab,
} from './types';
import {
  loadSavedState,
  saveState,
  resetSampleData,
  clearAllData,
  exportStateAsJson,
  importStateFromJson,
  generateRecurringPlannerInstances,
  AppState,
} from './utils/storage';
import { getZonedDateString, isTaskIdle, deadlineBucket, normalizeTags } from './utils/date';
import { playSubtaskCheckSound, playTaskCompleteSound, triggerHaptic } from './utils/sound';
import { CelebrationLayer, fireSmallConfetti, fireBigConfetti } from './components/CelebrationLayer';
import { Header } from './components/Header';
import { StatDashboard } from './components/StatDashboard';
import { WeeklyReview } from './components/WeeklyReview';
import { CalendarPanel } from './components/CalendarPanel';
import { ControlStrip } from './components/ControlStrip';
import { IdleBanner } from './components/IdleBanner';
import { DomainsList } from './components/DomainsList';
import { RecurringList } from './components/RecurringList';
import { GoalsSection } from './components/GoalsSection';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { JournalPad } from './components/JournalPad';
import { PlannerPdfModal } from './components/PlannerPdfModal';
import { SettingsModal } from './components/SettingsModal';
import { ExpenseHeader } from './components/expenses/ExpenseHeader';
import { ExpenseOverview } from './components/expenses/ExpenseOverview';
import { ExpenseTransactions } from './components/expenses/ExpenseTransactions';
import { ExpenseAddModal } from './components/expenses/ExpenseAddModal';
import { ExpenseCategoriesManager } from './components/expenses/ExpenseCategoriesManager';
import { ExpenseRecurringManager } from './components/expenses/ExpenseRecurringManager';
import { ExpenseReports } from './components/expenses/ExpenseReports';
import { ExpensePdfModal } from './components/expenses/ExpensePdfModal';

export default function App() {
  // Master app state
  const [state, setState] = useState<AppState>(() => loadSavedState());

  // Active top-level tabs & views
  const [activeTab, setActiveTab] = useState<MainTab>('planner');
  const [expenseSubTab, setExpenseSubTab] = useState<ExpenseSubTab>('overview');
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  // Planner filter & view states
  const [currentView, setCurrentView] = useState<FilterView>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Celebrations
  const [sealVisible, setSealVisible] = useState<boolean>(false);
  const [isPlannerPdfOpen, setIsPlannerPdfOpen] = useState<boolean>(false);
  const [isExpensePdfOpen, setIsExpensePdfOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExpenseAddOpen, setIsExpenseAddOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [expenseAddInitialType, setExpenseAddInitialType] = useState<'expense' | 'income'>('expense');

  // Expense month state
  const now = new Date();
  const [selectedExpenseMonthYear, setSelectedExpenseMonthYear] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

  // Calculate authoritative today string in user's timezone (default Asia/Kolkata)
  const todayStr = useMemo(() => {
    return getZonedDateString(new Date(), state.profile.timezone || 'Asia/Kolkata');
  }, [state.profile.timezone]);

  // Compute idle tasks flags dynamically
  const domainsWithIdle = useMemo(() => {
    return state.domains.map(d => ({
      ...d,
      tasks: d.tasks.map(t => ({
        ...t,
        idle: isTaskIdle(t, todayStr),
      })),
    }));
  }, [state.domains, todayStr]);

  // Lazy recurring generation on mount and on date change
  useEffect(() => {
    setState(prev => {
      const clone = { ...prev };
      const modified = generateRecurringPlannerInstances(clone, todayStr);
      if (modified) {
        saveState(clone);
        return clone;
      }
      return prev;
    });
  }, [todayStr]);

  // 60-second background refresh (pauses while any modal is open)
  useEffect(() => {
    const isAnyModalOpen =
      isPlannerPdfOpen ||
      isExpensePdfOpen ||
      isSettingsOpen ||
      isExpenseAddOpen ||
      calendarOpen;

    if (isAnyModalOpen) return;

    const interval = setInterval(() => {
      const refreshedTodayStr = getZonedDateString(new Date(), state.profile.timezone || 'Asia/Kolkata');
      setState(prev => {
        const clone = { ...prev };
        const modified = generateRecurringPlannerInstances(clone, refreshedTodayStr);
        if (modified) {
          saveState(clone);
          return clone;
        }
        return prev;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [isPlannerPdfOpen, isExpensePdfOpen, isSettingsOpen, isExpenseAddOpen, calendarOpen, state.profile.timezone]);

  // Save changes to localStorage
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // Planner actions
  const handleUpdateDomains = (updatedDomains: Domain[]) => {
    updateState(prev => ({ ...prev, domains: updatedDomains }));
  };

  const handleUpdateRecurring = (updatedRecurring: RecurringTemplate[]) => {
    updateState(prev => ({ ...prev, recurring: updatedRecurring }));
  };

  const handleUpdateGoals = (updatedGoals: Goal[]) => {
    updateState(prev => ({ ...prev, goals: updatedGoals }));
  };

  const handleSaveJournal = (content: string) => {
    updateState(prev => ({
      ...prev,
      journal: { content, updated_at: new Date().toISOString() },
    }));
  };

  // Subtask check handling (Confetti, Haptic, Sound, Auto-Complete)
  const handleSubtaskCheck = (subtask: Subtask, parentTask: Task, willCompleteParent: boolean) => {
    if (willCompleteParent) {
      // Big celebration! Gold seal stamp + big confetti + triumphant audio + success haptic
      if (state.profile.sound_enabled) playTaskCompleteSound();
      if (state.profile.haptic_enabled) triggerHaptic('success');
      fireBigConfetti();
      setSealVisible(true);
      setTimeout(() => setSealVisible(false), 1700);
    } else {
      // Small celebration for subtask
      if (state.profile.sound_enabled) playSubtaskCheckSound();
      if (state.profile.haptic_enabled) triggerHaptic('light');
      fireSmallConfetti();
    }
  };

  const handleSubtaskUncheck = (subtask: Subtask, parentTask: Task) => {
    if (state.profile.haptic_enabled) triggerHaptic('light');
  };

  // Jump to task with 3x blink
  const handleJumpToTask = (taskId: string) => {
    // Switch to Planner and All view so task is visible
    if (activeTab !== 'planner') setActiveTab('planner');
    setCurrentView('all');
    setSelectedTag('');
    setSearchQuery('');
    setCalendarOpen(false);

    // Expand parent domain if collapsed
    setTimeout(() => {
      const el = document.getElementById(`task-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('blink-3x');
        setTimeout(() => el.classList.remove('blink-3x'), 1900);
      }
    }, 100);
  };

  // Home button action (scroll to top, reset filters, close calendar)
  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('all');
    setSelectedTag('');
    setSearchQuery('');
    setCalendarOpen(false);
  };

  // Calculate view counts for the control strip
  const viewCounts = useMemo(() => {
    const counts: Record<FilterView, number> = {
      all: 0,
      today: 0,
      tomorrow: 0,
      overdue: 0,
      week: 0,
      done: 0,
    };

    domainsWithIdle.forEach(d => {
      d.tasks.forEach(t => {
        if (t.status === 'done') {
          counts.done++;
        } else {
          counts.all++;

          const taskBucket = deadlineBucket(t.deadline, false, todayStr);
          if (taskBucket === 'today') counts.today++;
          if (taskBucket === 'tomorrow') counts.tomorrow++;
          if (taskBucket === 'overdue') counts.overdue++;
          if (taskBucket === 'today' || taskBucket === 'tomorrow' || taskBucket === 'overdue' || taskBucket === 'week') {
            counts.week++;
          }

          // Also check subtasks
          t.subtasks.forEach(s => {
            if (!s.done && s.deadline) {
              const subBucket = deadlineBucket(s.deadline, false, todayStr);
              if (subBucket === 'today' && taskBucket !== 'today') counts.today++;
              if (subBucket === 'tomorrow' && taskBucket !== 'tomorrow') counts.tomorrow++;
              if (subBucket === 'overdue' && taskBucket !== 'overdue') counts.overdue++;
              if ((subBucket === 'today' || subBucket === 'tomorrow' || subBucket === 'overdue' || subBucket === 'week') &&
                  !(taskBucket === 'today' || taskBucket === 'tomorrow' || taskBucket === 'overdue' || taskBucket === 'week')) {
                counts.week++;
              }
            }
          });
        }
      });
    });

    return counts;
  }, [domainsWithIdle, todayStr]);

  // Available unique tags with counts
  const availableTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};

    domainsWithIdle.forEach(d => {
      d.tasks.forEach(t => {
        t.tags.forEach(tag => {
          tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        });
        t.subtasks.forEach(s => {
          s.tags.forEach(tag => {
            tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
          });
        });
      });
    });

    return Object.entries(tagCountMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [domainsWithIdle]);

  // Expense actions
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      // Edit existing
      updateState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => (t.id === txData.id ? ({ ...t, ...txData } as Transaction) : t)),
      }));
    } else {
      // Add new
      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        type: txData.type || 'expense',
        amount: txData.amount || 0,
        currency: state.profile.currency,
        date: txData.date || todayStr,
        category_id: txData.category_id || state.expenseCategories[0].id,
        payment_method_id: txData.payment_method_id || state.paymentMethods[0].id,
        note: txData.note,
        payee: txData.payee,
        tags: txData.tags || [],
        created_at: new Date().toISOString(),
      };
      updateState(prev => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    updateState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsExpenseAddOpen(true);
  };

  const handleOpenAddModal = (type: 'expense' | 'income' = 'expense') => {
    setEditingTransaction(null);
    setExpenseAddInitialType(type);
    setIsExpenseAddOpen(true);
  };

  const handleUpdateCategories = (cats: ExpenseCategory[]) => {
    updateState(prev => ({ ...prev, expenseCategories: cats }));
  };

  const handleUpdateExpenseRecurring = (recs: ExpenseRecurringTemplate[]) => {
    updateState(prev => ({ ...prev, expenseRecurring: recs }));
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    updateState(prev => ({ ...prev, profile: updatedProfile }));
  };

  const handleLoadSampleData = () => {
    const sample = resetSampleData();
    setState(sample);
  };

  const handleClearAllData = () => {
    const cleared = clearAllData();
    setState(cleared);
  };

  const handleExportJson = () => {
    exportStateAsJson(state);
  };

  const handleImportJson = (jsonStr: string) => {
    const imported = importStateFromJson(jsonStr);
    setState(imported);
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#10202B] selection:bg-[#D9A017] selection:text-white pb-14 font-sans">
      {/* Celebration Layer (Confetti & Gold Seal) */}
      <CelebrationLayer sealVisible={sealVisible} />

      {/* Top Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        onHomeClick={handleHomeClick}
        onOpenSettings={() => setIsSettingsOpen(true)}
        profile={state.profile}
      />

      {/* Main Content Column (Mobile 390px first, max-w 680px centered) */}
      <main className="max-w-[700px] mx-auto px-3.5 sm:px-4 pt-3.5">
        {activeTab === 'planner' ? (
          /* ==================== PLANNER VIEW ==================== */
          <div className="space-y-4">
            {/* 2x2 Clickable Stat Dashboard */}
            <StatDashboard
              domains={domainsWithIdle}
              todayStr={todayStr}
              onJumpToTask={handleJumpToTask}
            />

            {/* Weekly Review Bars (Mon–Sun) */}
            <WeeklyReview domains={domainsWithIdle} todayStr={todayStr} />

            {/* Calendar Panel (Toggled via header icon) */}
            {calendarOpen && (
              <CalendarPanel
                domains={domainsWithIdle}
                recurring={state.recurring}
                todayStr={todayStr}
                onJumpToTask={handleJumpToTask}
                onClose={() => setCalendarOpen(false)}
              />
            )}

            {/* Filter View Bar, Tag Select & Search */}
            <ControlStrip
              currentView={currentView}
              setCurrentView={setCurrentView}
              viewCounts={viewCounts}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              availableTags={availableTags}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />

            {/* Idle Stalled Task Alert Banner */}
            <IdleBanner domains={domainsWithIdle} onJumpToTask={handleJumpToTask} />

            {/* Domains, Tasks, Subtasks & Completed collapsible */}
            <DomainsList
              domains={domainsWithIdle}
              onUpdateDomains={handleUpdateDomains}
              todayStr={todayStr}
              currentView={currentView}
              selectedTag={selectedTag}
              searchQuery={searchQuery}
              onSubtaskCheck={handleSubtaskCheck}
              onSubtaskUncheck={handleSubtaskUncheck}
              onOpenPdfModal={() => setIsPlannerPdfOpen(true)}
              onExportJson={handleExportJson}
            />

            {/* Recurring Habits & Tasks */}
            <RecurringList
              recurring={state.recurring}
              domains={domainsWithIdle}
              todayStr={todayStr}
              onUpdateRecurring={handleUpdateRecurring}
            />

            {/* Annual, Quarterly & Monthly Goals */}
            <GoalsSection
              goals={state.goals}
              onUpdateGoals={handleUpdateGoals}
              todayStr={todayStr}
            />

            {/* Dynamic Eisenhower Matrix */}
            <EisenhowerMatrix
              domains={domainsWithIdle}
              onJumpToTask={handleJumpToTask}
            />

            {/* Free-write Lined-Paper Journal Scratchpad */}
            <JournalPad
              journal={state.journal}
              onSaveJournal={handleSaveJournal}
            />
          </div>
        ) : (
          /* ==================== EXPENSE TRACKER VIEW ==================== */
          <div>
            {/* Sub-navigation & Statement PDF button */}
            <ExpenseHeader
              currentSubTab={expenseSubTab}
              setCurrentSubTab={setExpenseSubTab}
              onOpenPdfModal={() => setIsExpensePdfOpen(true)}
            />

            {/* Overview Screen */}
            {expenseSubTab === 'overview' && (
              <ExpenseOverview
                transactions={state.transactions}
                categories={state.expenseCategories}
                paymentMethods={state.paymentMethods}
                profile={state.profile}
                selectedMonthYear={selectedExpenseMonthYear}
                setSelectedMonthYear={setSelectedExpenseMonthYear}
                onOpenAddModal={handleOpenAddModal}
                onGoToTransactions={() => setExpenseSubTab('transactions')}
                onGoToBudgets={() => setExpenseSubTab('categories')}
              />
            )}

            {/* Transactions History Screen */}
            {expenseSubTab === 'transactions' && (
              <ExpenseTransactions
                transactions={state.transactions}
                categories={state.expenseCategories}
                paymentMethods={state.paymentMethods}
                profile={state.profile}
                todayStr={todayStr}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
                onOpenAddModal={() => handleOpenAddModal('expense')}
              />
            )}

            {/* Categories & Budgets Manager */}
            {expenseSubTab === 'categories' && (
              <ExpenseCategoriesManager
                categories={state.expenseCategories}
                onUpdateCategories={handleUpdateCategories}
                profile={state.profile}
              />
            )}

            {/* Recurring Expenses Manager */}
            {expenseSubTab === 'recurring' && (
              <ExpenseRecurringManager
                recurring={state.expenseRecurring}
                categories={state.expenseCategories}
                paymentMethods={state.paymentMethods}
                profile={state.profile}
                todayStr={todayStr}
                onUpdateRecurring={handleUpdateExpenseRecurring}
              />
            )}

            {/* Analytics & Reports Screen */}
            {expenseSubTab === 'reports' && (
              <ExpenseReports
                transactions={state.transactions}
                categories={state.expenseCategories}
                paymentMethods={state.paymentMethods}
                profile={state.profile}
              />
            )}
          </div>
        )}
      </main>

      {/* Planner PDF Modal */}
      <PlannerPdfModal
        isOpen={isPlannerPdfOpen}
        onClose={() => setIsPlannerPdfOpen(false)}
        domains={domainsWithIdle}
        todayStr={todayStr}
        userName={state.profile.display_name}
      />

      {/* Expense Statement PDF Modal */}
      <ExpensePdfModal
        isOpen={isExpensePdfOpen}
        onClose={() => setIsExpensePdfOpen(false)}
        transactions={state.transactions}
        categories={state.expenseCategories}
        paymentMethods={state.paymentMethods}
        profile={state.profile}
        initialMonthStr={`${selectedExpenseMonthYear.year}-${String(selectedExpenseMonthYear.month).padStart(2, '0')}`}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={state.profile}
        onUpdateProfile={handleUpdateProfile}
        onLoadSampleData={handleLoadSampleData}
        onClearAllData={handleClearAllData}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Add / Edit Transaction Sheet */}
      <ExpenseAddModal
        isOpen={isExpenseAddOpen}
        onClose={() => {
          setIsExpenseAddOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        categories={state.expenseCategories}
        paymentMethods={state.paymentMethods}
        profile={state.profile}
        todayStr={todayStr}
        initialType={expenseAddInitialType}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
