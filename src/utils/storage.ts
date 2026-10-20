/**
 * Local Offline-First Storage Engine
 * Persists all Planner & Expense Tracker data reliably in browser LocalStorage.
 * Includes realistic sample data, backup/restore JSON, and lazy recurring generators.
 */

import {
  UserProfile,
  Domain,
  RecurringTemplate,
  Goal,
  JournalEntry,
  ExpenseCategory,
  PaymentMethod,
  Transaction,
  ExpenseRecurringTemplate,
  Task,
  Subtask
} from '../types';
import { getZonedDateString, templateFiresOnWeekday, normalizeTags } from './date';

export interface AppState {
  profile: UserProfile;
  domains: Domain[];
  recurring: RecurringTemplate[];
  goals: Goal[];
  journal: JournalEntry;
  expenseCategories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  expenseRecurring: ExpenseRecurringTemplate[];
}

const STORAGE_KEY = 'monthly_planner_v8_data';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'user_default',
  display_name: 'Harsh Makwana',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  currency_symbol: '₹',
  sound_enabled: true,
  haptic_enabled: true,
  onboarding_completed: true,
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm_upi', name: 'UPI', icon: 'Smartphone', sort_order: 1 },
  { id: 'pm_card', name: 'Card', icon: 'CreditCard', sort_order: 2 },
  { id: 'pm_cash', name: 'Cash', icon: 'Banknote', sort_order: 3 },
  { id: 'pm_bank', name: 'Bank Transfer', icon: 'Building', sort_order: 4 },
];

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#D9531E', sort_order: 1, monthly_budget: 8000 },
  { id: 'cat_groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#4C8557', sort_order: 2, monthly_budget: 6000 },
  { id: 'cat_transport', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#2A6FA3', sort_order: 3, monthly_budget: 4000 },
  { id: 'cat_housing', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#1F3A52', sort_order: 4, monthly_budget: 20000 },
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#D9A017', sort_order: 5, monthly_budget: 3500 },
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#7A4F82', sort_order: 6, monthly_budget: 5000 },
  { id: 'cat_health', name: 'Health & Fitness', type: 'expense', icon: 'HeartPulse', color: '#C4331E', sort_order: 7, monthly_budget: 3000 },
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8A5A3B', sort_order: 8, monthly_budget: 2500 },
  { id: 'cat_business', name: 'Business / Office', type: 'expense', icon: 'Briefcase', color: '#5B6670', sort_order: 9, monthly_budget: 10000 },
  { id: 'cat_other_exp', name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#718096', sort_order: 10, monthly_budget: null },

  { id: 'cat_salary', name: 'Salary / Client Retainer', type: 'income', icon: 'Briefcase', color: '#2A7F73', sort_order: 1 },
  { id: 'cat_freelance', name: 'Freelance & Consulting', type: 'income', icon: 'Laptop', color: '#1F3A52', sort_order: 2 },
  { id: 'cat_investments', name: 'Investments & Returns', type: 'income', icon: 'TrendingUp', color: '#4C8557', sort_order: 3 },
  { id: 'cat_other_inc', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#D9A017', sort_order: 4 },
];

export function getSampleInitialState(): AppState {
  const todayStr = getZonedDateString(new Date(), DEFAULT_PROFILE.timezone);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.floor(now.getMonth() / 3) + 1;

  // Compute dates around today
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  const overdueDate = new Date(now);
  overdueDate.setDate(overdueDate.getDate() - 4);
  const overdueStr = overdueDate.toISOString().slice(0, 10);

  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString();

  const domain1Id = 'dom_work';
  const domain2Id = 'dom_self';
  const domain3Id = 'dom_finance';

  const task1Id = 'task_q3_campaign';
  const task2Id = 'task_hiring';
  const task3Id = 'task_gym';
  const task4Id = 'task_idle_stalled';

  const domains: Domain[] = [
    {
      id: domain1Id,
      name: 'Work / Marketing Agency',
      sort_order: 1,
      tasks: [
        {
          id: task1Id,
          domain_id: domain1Id,
          name: 'Launch Q4 Strategy & Client Outreach',
          priority: 'high',
          tags: ['CLIENTS', 'OUTREACH', 'Q4'],
          important: true,
          urgent: true,
          status: 'active',
          deadline: todayStr,
          completed_at: null,
          created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
          subtasks: [
            {
              id: 'sub_pitch_deck',
              task_id: task1Id,
              name: 'Finalize pitch deck for Nayan Sir review',
              priority: 'high',
              tags: ['CLIENTS', 'OUTREACH'],
              deadline: todayStr,
              done: false,
              completed_at: null,
            },
            {
              id: 'sub_target_list',
              task_id: task1Id,
              name: 'Prepare target list of 25 qualified leads',
              priority: 'medium',
              tags: ['OUTREACH'],
              deadline: tomorrowStr,
              done: false,
              completed_at: null,
            },
            {
              id: 'sub_budget_approval',
              task_id: task1Id,
              name: 'Review ad spend budget allocations',
              priority: 'medium',
              tags: ['Q4'],
              deadline: todayStr,
              done: true,
              completed_at: new Date().toISOString(),
            }
          ]
        },
        {
          id: task2Id,
          domain_id: domain1Id,
          name: 'Senior Frontend Developer Hiring',
          priority: 'medium',
          tags: ['HIRING', 'TEAM'],
          important: true,
          urgent: false,
          status: 'active',
          deadline: tomorrowStr,
          completed_at: null,
          created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
          subtasks: [
            {
              id: 'sub_screen_resumes',
              task_id: task2Id,
              name: 'Screen initial 10 candidate submissions',
              priority: 'medium',
              tags: ['HIRING'],
              deadline: tomorrowStr,
              done: false,
              completed_at: null,
            },
            {
              id: 'sub_schedule_interview',
              task_id: task2Id,
              name: 'Send calendar invites for technical round',
              priority: 'low',
              tags: ['HIRING'],
              deadline: tomorrowStr,
              done: false,
              completed_at: null,
            }
          ]
        },
        {
          id: task4Id,
          domain_id: domain1Id,
          name: 'Old Website Redesign Project Review',
          priority: 'low',
          tags: ['REDESIGN', 'OLD'],
          important: false,
          urgent: false,
          status: 'active',
          deadline: overdueStr,
          completed_at: null,
          created_at: fiveDaysAgoStr, // 5 days old -> triggers idle rule!
          subtasks: [
            {
              id: 'sub_audit_wireframes',
              task_id: task4Id,
              name: 'Audit leftover Figma wireframes',
              priority: 'low',
              tags: ['REDESIGN'],
              deadline: overdueStr,
              done: false,
              completed_at: null, // No completion in 3+ days
            }
          ]
        }
      ]
    },
    {
      id: domain2Id,
      name: 'Self / Health & Habits',
      sort_order: 2,
      tasks: [
        {
          id: task3Id,
          domain_id: domain2Id,
          name: 'Morning Conditioning & Mobility Routine',
          priority: 'high',
          tags: ['HEALTH', 'ROUTINE'],
          important: true,
          urgent: false,
          status: 'active',
          deadline: todayStr,
          completed_at: null,
          created_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
          subtasks: [
            {
              id: 'sub_hydration',
              task_id: task3Id,
              name: 'Hydrate 1L with electrolytes',
              priority: 'low',
              tags: ['HEALTH'],
              deadline: todayStr,
              done: true,
              completed_at: new Date().toISOString(),
            },
            {
              id: 'sub_workout',
              task_id: task3Id,
              name: '45-minute strength training & core',
              priority: 'high',
              tags: ['ROUTINE'],
              deadline: todayStr,
              done: false,
              completed_at: null,
            }
          ]
        }
      ]
    },
    {
      id: domain3Id,
      name: 'Finance & Operations',
      sort_order: 3,
      tasks: [
        {
          id: 'task_tax_audit',
          domain_id: domain3Id,
          name: 'Monthly Accounting & Expense Reconciliation',
          priority: 'medium',
          tags: ['ACCOUNTS', 'GST'],
          important: true,
          urgent: true,
          status: 'active',
          deadline: todayStr,
          completed_at: null,
          created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
          subtasks: [
            {
              id: 'sub_reconcile_bank',
              task_id: 'task_tax_audit',
              name: 'Match UPI and Card statements with receipts',
              priority: 'medium',
              tags: ['ACCOUNTS'],
              deadline: todayStr,
              done: false,
              completed_at: null,
            }
          ]
        }
      ]
    }
  ];

  const recurring: RecurringTemplate[] = [
    {
      id: 'rec_journal',
      domain_id: domain2Id,
      task_id: null,
      name: 'Daily Evening Reflection & Journaling',
      frequency: 'daily',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      priority: 'medium',
      tags: ['ROUTINE', 'EVENING'],
      important: true,
      urgent: false,
      active: true,
      streak: 5,
    },
    {
      id: 'rec_linkedin',
      domain_id: domain1Id,
      task_id: task1Id,
      name: 'Publish Industry Insights Article',
      frequency: 'weekly',
      weekdays: [1, 3, 5], // Mon, Wed, Fri
      priority: 'high',
      tags: ['OUTREACH', 'CONTENT'],
      important: true,
      urgent: false,
      active: true,
      streak: 3,
    }
  ];

  const goals: Goal[] = [
    {
      id: 'goal_annual_1',
      domain_id: domain1Id,
      title: 'Achieve ₹50L ARR for PCA Marketing Agency',
      type: 'annual',
      year: year,
      target_date: `${year}-12-31`,
      notes: 'Focus on high-ticket retainer accounts.',
      done: false,
      items: [
        { id: 'gi_1', goal_id: 'goal_annual_1', name: 'Secure 10 monthly retainer clients', done: true },
        { id: 'gi_2', goal_id: 'goal_annual_1', name: 'Build automated inbound sales pipeline', done: false },
        { id: 'gi_3', goal_id: 'goal_annual_1', name: 'Establish 4 strategic agency partnerships', done: false }
      ]
    },
    {
      id: 'goal_quarterly_1',
      domain_id: domain1Id,
      title: 'Close 3 new enterprise retainers in Q' + quarter,
      type: 'quarterly',
      year: year,
      quarter: quarter,
      target_date: `${year}-09-30`,
      notes: 'Target financial services & D2C brands',
      done: false,
      items: [
        { id: 'gi_q1', goal_id: 'goal_quarterly_1', name: 'Send 60 personalized proposals', done: true },
        { id: 'gi_q2', goal_id: 'goal_quarterly_1', name: 'Conduct 15 demo walkthroughs', done: false }
      ]
    },
    {
      id: 'goal_monthly_1',
      domain_id: domain2Id,
      title: 'Read 2 books on behavioral psychology & finance',
      type: 'monthly',
      year: year,
      month: month,
      target_date: `${year}-${String(month).padStart(2, '0')}-28`,
      notes: 'Currently reading Psychology of Money',
      done: false,
      items: []
    },
    {
      id: 'goal_monthly_2',
      domain_id: domain1Id,
      title: 'Publish 12 high-impact thought leadership posts',
      type: 'monthly',
      year: year,
      month: month,
      target_date: `${year}-${String(month).padStart(2, '0')}-30`,
      notes: '3 posts every week',
      done: true,
      items: []
    }
  ];

  const journal: JournalEntry = {
    content: "Weekly review notes:\n- High priority client pitch moving into final negotiation.\n- Morning conditioning streak at 5 days straight. Energy levels noticeably higher.\n- Keep expenses disciplined this month; allocation to ad spend working well.",
    updated_at: new Date().toISOString(),
  };

  const transactions: Transaction[] = [
    {
      id: 'tx_1',
      type: 'income',
      amount: 85000,
      currency: 'INR',
      date: `${year}-${String(month).padStart(2, '0')}-01`,
      category_id: 'cat_salary',
      payment_method_id: 'pm_bank',
      note: 'Monthly Agency Retainer',
      payee: 'Apex Global Corp',
      tags: ['INCOME', 'CLIENT'],
      created_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
    },
    {
      id: 'tx_2',
      type: 'income',
      amount: 28000,
      currency: 'INR',
      date: `${year}-${String(month).padStart(2, '0')}-05`,
      category_id: 'cat_freelance',
      payment_method_id: 'pm_upi',
      note: 'Landing Page Redesign Milestone 2',
      payee: 'Zenith Ventures',
      tags: ['FREELANCE'],
      created_at: new Date(now.getTime() - 12 * 86400000).toISOString(),
    },
    {
      id: 'tx_3',
      type: 'expense',
      amount: 18000,
      currency: 'INR',
      date: `${year}-${String(month).padStart(2, '0')}-02`,
      category_id: 'cat_housing',
      payment_method_id: 'pm_bank',
      note: 'Apartment Monthly Rent',
      payee: 'Landlord',
      tags: ['RENT'],
      created_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
    },
    {
      id: 'tx_4',
      type: 'expense',
      amount: 3450,
      currency: 'INR',
      date: yesterdayStr,
      category_id: 'cat_groceries',
      payment_method_id: 'pm_card',
      note: 'Weekly Organic Grocery Stockup',
      payee: 'Nature Basket',
      tags: ['HOME'],
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'tx_5',
      type: 'expense',
      amount: 1200,
      currency: 'INR',
      date: todayStr,
      category_id: 'cat_food',
      payment_method_id: 'pm_upi',
      note: 'Client Lunch Meeting',
      payee: 'Blue Tokai Coffee',
      tags: ['CLIENT', 'FOOD'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_6',
      type: 'expense',
      amount: 2500,
      currency: 'INR',
      date: yesterdayStr,
      category_id: 'cat_transport',
      payment_method_id: 'pm_card',
      note: 'Fuel for Highway Travel',
      payee: 'Shell Petrol Pump',
      tags: ['FUEL'],
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    }
  ];

  const expenseRecurring: ExpenseRecurringTemplate[] = [
    {
      id: 'exp_rec_rent',
      type: 'expense',
      amount: 18000,
      category_id: 'cat_housing',
      payment_method_id: 'pm_bank',
      note: 'Monthly Apartment Rent',
      frequency: 'monthly',
      day_of_month: 2,
      start_on: `${year}-01-01`,
      active: true,
    },
    {
      id: 'exp_rec_wifi',
      type: 'expense',
      amount: 1199,
      category_id: 'cat_bills',
      payment_method_id: 'pm_upi',
      note: 'High-speed Fiber Internet',
      frequency: 'monthly',
      day_of_month: 5,
      start_on: `${year}-01-01`,
      active: true,
    }
  ];

  return {
    profile: DEFAULT_PROFILE,
    domains,
    recurring,
    goals,
    journal,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    transactions,
    expenseRecurring,
  };
}

/**
 * Lazy generation of today's recurring planner instances:
 * Deduplicates by recurring_template_id + todayStr.
 * Generates subtask if template.task_id exists, otherwise a standalone task.
 */
export function generateRecurringPlannerInstances(state: AppState, todayStr: string): boolean {
  const [y, m, d] = todayStr.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0=Sun..6=Sat
  let stateModified = false;

  state.recurring.forEach(tpl => {
    if (!templateFiresOnWeekday(tpl, weekday)) return;

    if (tpl.task_id) {
      // Find parent task
      let parentTask: Task | null = null;
      for (const dom of state.domains) {
        const found = dom.tasks.find(t => t.id === tpl.task_id);
        if (found) {
          parentTask = found;
          break;
        }
      }
      if (!parentTask) return;

      // Check if instance already exists for today
      const alreadyExists = parentTask.subtasks.some(
        s => s.recurring_template_id === tpl.id && s.deadline === todayStr
      );

      if (!alreadyExists) {
        const newSubtask: Subtask = {
          id: `rec_sub_${tpl.id}_${todayStr}`,
          task_id: parentTask.id,
          name: `${tpl.name} (${todayStr})`,
          priority: tpl.priority,
          tags: normalizeTags(tpl.tags),
          deadline: todayStr,
          done: false,
          completed_at: null,
          is_recurring_instance: true,
          recurring_template_id: tpl.id,
        };
        parentTask.subtasks.push(newSubtask);
        stateModified = true;
      }
    } else {
      // Standalone task in template domain
      const targetDomain = state.domains.find(d => d.id === tpl.domain_id) || state.domains[0];
      if (!targetDomain) return;

      const alreadyExists = targetDomain.tasks.some(
        t => t.recurring_template_id === tpl.id && t.deadline === todayStr
      );

      if (!alreadyExists) {
        const newTask: Task = {
          id: `rec_task_${tpl.id}_${todayStr}`,
          domain_id: targetDomain.id,
          name: `${tpl.name} (${todayStr})`,
          priority: tpl.priority,
          tags: normalizeTags(tpl.tags),
          important: tpl.important,
          urgent: tpl.urgent,
          status: 'active',
          deadline: todayStr,
          completed_at: null,
          created_at: new Date().toISOString(),
          is_recurring_instance: true,
          recurring_template_id: tpl.id,
          subtasks: [],
        };
        targetDomain.tasks.push(newTask);
        stateModified = true;
      }
    }
  });

  return stateModified;
}

/**
 * Load app state from LocalStorage with fallback to initial sample data
 */
export function loadSavedState(): AppState {
  if (typeof window === 'undefined') {
    return getSampleInitialState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getSampleInitialState();
      saveState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppState;

    // Ensure required top-level arrays exist
    if (!parsed.domains) parsed.domains = [];
    if (!parsed.recurring) parsed.recurring = [];
    if (!parsed.goals) parsed.goals = [];
    if (!parsed.expenseCategories || parsed.expenseCategories.length === 0) {
      parsed.expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
    }
    if (!parsed.paymentMethods || parsed.paymentMethods.length === 0) {
      parsed.paymentMethods = DEFAULT_PAYMENT_METHODS;
    }
    if (!parsed.transactions) parsed.transactions = [];
    if (!parsed.expenseRecurring) parsed.expenseRecurring = [];
    if (!parsed.profile) parsed.profile = DEFAULT_PROFILE;
    if (!parsed.journal) parsed.journal = { content: '', updated_at: new Date().toISOString() };

    // Run lazy recurring generator
    const todayStr = getZonedDateString(new Date(), parsed.profile.timezone || 'Asia/Kolkata');
    const wasModified = generateRecurringPlannerInstances(parsed, todayStr);
    if (wasModified) {
      saveState(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getSampleInitialState();
  }
}

/**
 * Save app state to LocalStorage
 */
export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Reset to pristine sample data
 */
export function resetSampleData(): AppState {
  const initial = getSampleInitialState();
  saveState(initial);
  return initial;
}

/**
 * Clear all user data to clean slate
 */
export function clearAllData(): AppState {
  const empty: AppState = {
    profile: DEFAULT_PROFILE,
    domains: [
      { id: 'dom_1', name: 'Company & Work', sort_order: 1, tasks: [] },
      { id: 'dom_2', name: 'Personal & Health', sort_order: 2, tasks: [] }
    ],
    recurring: [],
    goals: [],
    journal: { content: '', updated_at: new Date().toISOString() },
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    transactions: [],
    expenseRecurring: [],
  };
  saveState(empty);
  return empty;
}

/**
 * Export full state as JSON file download
 */
export function exportStateAsJson(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = getZonedDateString(new Date(), state.profile.timezone);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `monthly-planner-backup-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Import state from a JSON string
 */
export function importStateFromJson(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString) as AppState;
  if (!parsed.domains || !Array.isArray(parsed.domains)) {
    throw new Error('Invalid backup file: missing domains data');
  }
  saveState(parsed);
  return parsed;
}
