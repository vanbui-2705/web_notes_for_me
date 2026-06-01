export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  is_active: boolean;
  xp?: number;
  level?: number;
  current_streak?: number;
  longest_streak?: number;
  last_active_date?: string | null;
  is_admin?: boolean;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  user_id: number;
  created_at: string;
}

export type NoteStatus = 'todo' | 'in_progress' | 'done';

export interface Note {
  id: number;
  title: string;
  content: string | null;
  date: string;
  status: NoteStatus;
  priority: number;
  category_id: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  event_type?: string | null;  // birthday, anniversary, holiday, special
  is_highlighted?: boolean;
  icon?: string | null;
  category?: Category;
  reward_amount?: number;
}

export interface Reminder {
  id: number;
  note_id: number;
  user_id: number;
  reminder_time: string;
  is_sent: boolean;
  created_at: string;
}

export interface NoteCreate {
  title: string;
  content?: string;
  date: string;
  status?: NoteStatus;
  priority?: number;
  category_id?: number | null;
  event_type?: string | null;
  is_highlighted?: boolean;
  icon?: string | null;
  reward_amount?: number;
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  date?: string;
  status?: NoteStatus;
  priority?: number;
  category_id?: number | null;
  event_type?: string | null;
  is_highlighted?: boolean;
  icon?: string | null;
  reward_amount?: number;
}

export interface CategoryCreate {
  name: string;
  color?: string;
}

export interface ReminderCreate {
  note_id: number;
  reminder_time: string;
}

export interface DailyStats {
  date: string;
  total: number;
  todo: number;
  in_progress: number;
  done: number;
}

// Gamification
export interface UserStats {
  xp: number;
  level: number;
  xp_to_next_level: number;
  progress_percentage: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  streak_tier: 'spark' | 'hot' | 'blaze' | 'legend';
  badges: Badge[];
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface LeaderboardEntry {
  id: number;
  username: string;
  xp: number;
  level: number;
}

// Habits
export interface Habit {
  id: number;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  color: string;
  icon: string;
  user_id: number;
  current_streak: number;
  longest_streak: number;
  created_at: string;
  is_completed_today?: boolean;
}

export interface HabitCreate {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  color?: string;
  icon?: string;
}

export interface HabitUpdate {
  title?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  color?: string;
  icon?: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  date: string;
  status: 'done' | 'missed';
  created_at: string;
}

export interface HabitCheckInResponse {
  success: boolean;
  current_streak: number;
  longest_streak: number;
  xp_gained: number;
}

// Finance
export interface Transaction {
  id: number;
  title: string;
  amount: number;
  date: string;
  note: string | null;
  category_id: number | null;
  user_id: number;
  created_at: string;
  category?: TransactionCategory;
}

export interface TransactionCreate {
  title: string;
  amount: number;
  date: string;
  note?: string;
  category_id?: number | null;
}

export interface TransactionUpdate {
  title?: string;
  amount?: number;
  date?: string;
  note?: string;
  category_id?: number | null;
}

export interface TransactionCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  user_id: number;
  created_at: string;
}

export interface TransactionCategoryCreate {
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense' | 'transfer';
}

export interface SavingGoal {
  id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  user_id: number;
  created_at: string;
}

export interface SavingGoalCreate {
  title: string;
  description?: string;
  target_amount: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface SavingGoalUpdate {
  title?: string;
  description?: string;
  target_amount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export interface FinanceSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
  cash_flow_30days: { date: string; amount: number }[];
  top_spending_categories: { category: string; icon: string; color: string; amount: number }[];
}

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: TransactionCategory;
}

export interface BudgetCreate {
  category_id: number;
  amount: number;
  month: number;
  year: number;
}

export interface Debt {
  id: number;
  user_id: number;
  person_name: string;
  amount: number;
  type: 'borrow' | 'lend';
  is_settled: boolean;
  date: string;
  notes?: string;
}

export interface DebtCreate {
  person_name: string;
  amount: number;
  type: 'borrow' | 'lend';
  notes?: string;
}

export interface DebtUpdate {
  person_name?: string;
  amount?: number;
  type?: 'borrow' | 'lend';
  is_settled?: boolean;
  notes?: string;
}

// Daily Metrics
export interface DailyMetric {
  id: number;
  user_id: number;
  date: string;
  metric_type: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMetricCreate {
  date: string;
  metric_type: string;
  value: string;
}

export interface DailyMetricUpdate {
  value: string;
}

// Focus Session
export interface FocusSession {
  id: number;
  user_id: number;
  duration_minutes: number;
  task_id: number | null;
  started_at: string;
  completed_at: string;
}

export interface FocusSessionCreate {
  duration_minutes: number;
  task_id?: number;
  started_at: string;
}

export interface FocusSessionSummary {
  total_minutes: number;
  total_hours: number;
  total_sessions: number;
  average_minutes: number;
  daily_breakdown: { date: string; minutes: number }[];
  period_days: number;
}
