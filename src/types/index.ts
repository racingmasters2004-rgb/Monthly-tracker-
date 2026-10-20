/**
 * Data Model Types for Monthly Planner & Expense Tracker
 */

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'active' | 'done';
export type FilterView = 'all' | 'today' | 'tomorrow' | 'overdue' | 'week' | 'done';
export type GoalType = 'annual' | 'quarterly' | 'monthly';
export type TransactionType = 'income' | 'expense';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface UserProfile {
  id: string;
  display_name: string;
  timezone: string; // default: 'Asia/Kolkata'
  currency: string; // default: 'INR'
  currency_symbol: string; // default: '₹'
  sound_enabled: boolean;
  haptic_enabled: boolean;
  onboarding_completed: boolean;
}

export interface Subtask {
  id: string;
  task_id: string;
  name: string;
  priority: Priority;
  tags: string[]; // Uppercase normalized
  deadline: string | null; // YYYY-MM-DD
  done: boolean;
  completed_at: string | null; // ISO string
  is_recurring_instance?: boolean;
  recurring_template_id?: string | null;
}

export interface Task {
  id: string;
  domain_id: string;
  name: string;
  priority: Priority;
  tags: string[]; // Uppercase normalized
  important: boolean;
  urgent: boolean;
  status: TaskStatus;
  deadline: string | null; // YYYY-MM-DD
  completed_at: string | null; // ISO string
  created_at: string; // ISO string
  is_recurring_instance?: boolean;
  recurring_template_id?: string | null;
  subtasks: Subtask[];
  idle?: boolean;
}

export interface Domain {
  id: string;
  name: string;
  sort_order: number;
  tasks: Task[];
  score?: number | null; // Computed weighted score %
}

export interface RecurringTemplate {
  id: string;
  domain_id: string;
  task_id?: string | null; // If set, generates a subtask under that task; if null, generates a task
  name: string;
  frequency: 'daily' | 'weekly';
  weekdays: number[]; // 0=Sun..6=Sat; [0,1,2,3,4,5,6] = daily
  priority: Priority;
  tags: string[];
  important: boolean;
  urgent: boolean;
  active: boolean;
  streak?: number;
}

export interface GoalItem {
  id: string;
  goal_id: string;
  name: string;
  done: boolean;
  completed_at?: string | null;
}

export interface Goal {
  id: string;
  domain_id?: string | null;
  title: string;
  type: GoalType;
  year: number;
  quarter?: number | null; // 1-4
  month?: number | null; // 1-12
  target_date?: string | null;
  notes?: string;
  done: boolean; // for monthly flat items
  items: GoalItem[]; // for annual & quarterly
  progress?: number | null; // computed %
}

export interface JournalEntry {
  content: string;
  updated_at: string;
}

export interface Scorecard {
  count: number;
  weighted_score: number;
}

export interface WeeklyReviewDay {
  planned: number;
  done: number;
}

export interface WeeklyReviewDomain {
  id: string;
  name: string;
  planned: number;
  done: number;
}

export interface WeeklyReview {
  range: {
    start: string; // YYYY-MM-DD
    end: string; // YYYY-MM-DD
  };
  total_planned: number;
  total_done: number;
  weighted_done: number;
  by_day: Record<string, WeeklyReviewDay>; // Mon..Sun
  by_domain: WeeklyReviewDomain[];
}

export interface EisenhowerQuadrant {
  key: 'do' | 'plan' | 'delegate' | 'drop';
  label: string;
}

// ==================== EXPENSE TRACKER TYPES ====================

export interface ExpenseCategory {
  id: string;
  name: string;
  type: TransactionType; // 'income' | 'expense'
  icon: string; // Lucide icon name
  color: string; // Hex color
  sort_order: number;
  monthly_budget?: number | null; // In main currency units
  archived?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon?: string;
  sort_order: number;
  archived?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // In currency units e.g. 450.50
  currency: string;
  date: string; // YYYY-MM-DD
  time?: string | null;
  category_id: string;
  payment_method_id: string;
  note?: string;
  payee?: string;
  tags: string[];
  recurring_template_id?: string | null;
  created_at: string;
}

export interface ExpenseRecurringTemplate {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  payment_method_id: string;
  note: string;
  frequency: Frequency;
  weekdays?: number[]; // for weekly (0=Sun..6=Sat)
  day_of_month?: number; // 1-31 for monthly (e.g. rent on the 1st)
  start_on: string; // YYYY-MM-DD
  end_on?: string | null;
  active: boolean;
}

export interface OverallBudget {
  month: string; // YYYY-MM
  amount: number;
}

export type MainTab = 'planner' | 'expenses';
export type ExpenseSubTab = 'overview' | 'transactions' | 'categories' | 'recurring' | 'reports';
