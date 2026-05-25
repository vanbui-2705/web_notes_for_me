import api from './api';
import type {
  User,
  Category,
  CategoryCreate,
  Note,
  NoteCreate,
  NoteUpdate,
  Reminder,
  ReminderCreate,
  DailyStats,
  UserStats,
  Badge,
  LeaderboardEntry,
  Habit,
  HabitCreate,
  HabitUpdate,
  HabitCheckInResponse,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionCategory,
  TransactionCategoryCreate,
  SavingGoal,
  SavingGoalCreate,
  SavingGoalUpdate,
  FinanceSummary,
  DailyMetric,
  DailyMetricCreate,
  DailyMetricUpdate,
  FocusSession,
  FocusSessionCreate,
  FocusSessionSummary,
  Budget,
  BudgetCreate,
  Debt,
  DebtCreate,
  DebtUpdate,
} from '../types/types';

const USE_MOCK_API = false;

// Mock data for fallback
const now = new Date();
let mockCategories: Category[] = [
  { id: 1, name: 'Công việc', color: '#6366f1', user_id: 1, created_at: now.toISOString() },
  { id: 2, name: 'Học tập', color: '#06b6d4', user_id: 1, created_at: now.toISOString() },
  { id: 3, name: 'Cá nhân', color: '#ec4899', user_id: 1, created_at: now.toISOString() },
];

let mockNotes: Note[] = [
  {
    id: 1,
    title: 'Xem giao diện trang chính',
    content: 'Dữ liệu mẫu này chạy trực tiếp ở frontend, không cần backend.',
    date: now.toISOString(),
    status: 'in_progress',
    priority: 3,
    category_id: 1,
    user_id: 1,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    event_type: null,
    is_highlighted: false,
    icon: null,
    category: mockCategories[0],
  },
];

const withCategory = (note: Note): Note => ({
  ...note,
  category: mockCategories.find((category) => category.id === note.category_id),
});

const sameDate = (isoDate: string, date?: string) => !date || isoDate.slice(0, 10) === date;

// Auth API
export const authAPI = {
  register: async (data: { email: string; username: string; password: string }) => {
    if (USE_MOCK_API) {
      return {
        id: 1,
        email: data.email,
        username: data.username,
        created_at: new Date().toISOString(),
        is_active: true,
      };
    }
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    if (USE_MOCK_API) {
      return { access_token: 'mock-token', token_type: 'bearer' };
    }
    const response = await api.post<{ access_token: string; token_type: string }>('/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    if (USE_MOCK_API) {
      return {
        id: 1,
        email: 'mock@example.com',
        username: 'mockuser',
        created_at: new Date().toISOString(),
        is_active: true,
        is_admin: true,
      };
    }
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    if (USE_MOCK_API) return [...mockCategories];
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  create: async (data: CategoryCreate) => {
    if (USE_MOCK_API) {
      const category: Category = {
        id: Date.now(),
        name: data.name,
        color: data.color || '#6366f1',
        user_id: 1,
        created_at: new Date().toISOString(),
      };
      mockCategories = [...mockCategories, category];
      return category;
    }
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  getById: async (id: number) => {
    if (USE_MOCK_API) return mockCategories.find((category) => category.id === id) || mockCategories[0];
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  delete: async (id: number) => {
    if (USE_MOCK_API) {
      mockCategories = mockCategories.filter((category) => category.id !== id);
      mockNotes = mockNotes.map((note) => note.category_id === id ? { ...note, category_id: null, category: undefined } : note);
      return { ok: true };
    }
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// Notes API
export const notesAPI = {
  getAll: async (params?: {
    date?: string;
    status?: string;
    category_id?: number;
    event_type?: string;
    is_highlighted?: boolean;
    search?: string;
  }) => {
    if (USE_MOCK_API) {
      return mockNotes
        .filter((note) => sameDate(note.date, params?.date))
        .filter((note) => !params?.status || note.status === params.status)
        .filter((note) => !params?.category_id || note.category_id === params.category_id)
        .filter((note) => !params?.event_type || note.event_type === params.event_type)
        .filter((note) => params?.is_highlighted === undefined || note.is_highlighted === params.is_highlighted)
        .filter((note) => {
          if (!params?.search) return true;
          const search = params.search.toLowerCase();
          return note.title.toLowerCase().includes(search) || note.content?.toLowerCase().includes(search);
        })
        .map(withCategory);
    }
    const response = await api.get<Note[]>('/notes', { params });
    return response.data;
  },

  create: async (data: NoteCreate) => {
    if (USE_MOCK_API) {
      const note: Note = withCategory({
        id: Date.now(),
        title: data.title,
        content: data.content || null,
        date: data.date,
        status: data.status || 'todo',
        priority: data.priority || 1,
        category_id: data.category_id || null,
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_type: data.event_type || null,
        is_highlighted: data.is_highlighted || false,
        icon: data.icon || null,
      });
      mockNotes = [note, ...mockNotes];
      return note;
    }
    const response = await api.post<Note>('/notes', data);
    return response.data;
  },

  getById: async (id: number) => {
    if (USE_MOCK_API) return withCategory(mockNotes.find((note) => note.id === id) || mockNotes[0]);
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },

  update: async (id: number, data: NoteUpdate) => {
    if (USE_MOCK_API) {
      const updatedAt = new Date().toISOString();
      mockNotes = mockNotes.map((note) => (
        note.id === id ? withCategory({
          ...note,
          ...data,
          updated_at: updatedAt,
          // Ensure optional fields are set properly
          event_type: data.event_type !== undefined ? data.event_type : note.event_type,
          is_highlighted: data.is_highlighted !== undefined ? data.is_highlighted : note.is_highlighted,
          icon: data.icon !== undefined ? data.icon : note.icon,
        }) : note
      ));
      return withCategory(mockNotes.find((note) => note.id === id) || mockNotes[0]);
    }
    const response = await api.put<Note>(`/notes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    if (USE_MOCK_API) {
      mockNotes = mockNotes.filter((note) => note.id !== id);
      return { ok: true };
    }
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  getDailyStats: async (date: string) => {
    if (USE_MOCK_API) {
      const notes = mockNotes.filter((note) => sameDate(note.date, date));
      return {
        date,
        total: notes.length,
        todo: notes.filter((note) => note.status === 'todo').length,
        in_progress: notes.filter((note) => note.status === 'in_progress').length,
        done: notes.filter((note) => note.status === 'done').length,
      };
    }
    const response = await api.get<DailyStats>(`/notes/stats/daily/${date}`);
    return response.data;
  },
};

// Reminders API
export const remindersAPI = {
  getAll: async (upcoming: boolean = true) => {
    if (USE_MOCK_API) return [];
    const response = await api.get<Reminder[]>('/reminders', { params: { upcoming } });
    return response.data;
  },

  create: async (data: ReminderCreate) => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        note_id: data.note_id,
        user_id: 1,
        reminder_time: data.reminder_time,
        is_sent: false,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<Reminder>('/reminders', data);
    return response.data;
  },

  delete: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};

// Gamification API
export const gamificationAPI = {
  getUserStats: async (): Promise<UserStats> => {
    if (USE_MOCK_API) {
      return {
        xp: 1250,
        level: 13,
        xp_to_next_level: 100,
        progress_percentage: 25,
        badges: [],
      };
    }
    const response = await api.get<UserStats>('/users/me/stats');
    return response.data;
  },

  addXP: async (xp: number, reason?: string) => {
    if (USE_MOCK_API) {
      return { success: true, xp_added: xp, total_xp: 1250, level: 13, level_up: false };
    }
    const response = await api.post('/users/me/add-xp', { xp, reason });
    return response.data;
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<LeaderboardEntry[]>('/users/me/leaderboard');
    return response.data;
  },
};

// Habits API
export const habitsAPI = {
  getAll: async (): Promise<Habit[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<Habit[]>('/habits');
    return response.data;
  },

  create: async (data: HabitCreate): Promise<Habit> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        title: data.title,
        description: data.description || null,
        frequency: data.frequency,
        color: data.color || '#a78bfa',
        icon: data.icon || '⭐',
        user_id: 1,
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<Habit>('/habits', data);
    return response.data;
  },

  getById: async (id: number): Promise<Habit> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.get<Habit>(`/habits/${id}`);
    return response.data;
  },

  update: async (id: number, data: HabitUpdate): Promise<Habit> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.put<Habit>(`/habits/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/habits/${id}`);
    return response.data;
  },

  checkIn: async (habitId: number, date?: string): Promise<HabitCheckInResponse> => {
    if (USE_MOCK_API) {
      return { success: true, current_streak: 1, longest_streak: 1, xp_gained: 5 };
    }
    const params = date ? { check_date: date } : {};
    const response = await api.post<HabitCheckInResponse>(`/habits/${habitId}/check`, params);
    return response.data;
  },

  uncheck: async (habitId: number, date?: string) => {
    if (USE_MOCK_API) return { success: true, current_streak: 0 };
    const params = date ? { check_date: date } : {};
    const response = await api.post(`/habits/${habitId}/uncheck`, params);
    return response.data;
  },
};

// Finance API
export const financeAPI = {
  getTransactions: async (params?: {
    start_date?: string;
    end_date?: string;
    category_id?: number;
  }): Promise<Transaction[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<Transaction[]>('/finance/transactions', { params });
    return response.data;
  },

  createTransaction: async (data: TransactionCreate): Promise<Transaction> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        title: data.title,
        amount: data.amount,
        date: data.date,
        note: data.note || null,
        category_id: data.category_id || null,
        user_id: 1,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<Transaction>('/finance/transactions', data);
    return response.data;
  },

  magicInput: async (text: string): Promise<Transaction> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        title: text,
        amount: -50000,
        date: new Date().toISOString(),
        note: 'Mock magic input',
        category_id: null,
        user_id: 1,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<Transaction>('/finance/magic-input', { text });
    return response.data;
  },

  updateTransaction: async (id: number, data: TransactionUpdate): Promise<Transaction> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.put<Transaction>(`/finance/transactions/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/finance/transactions/${id}`);
    return response.data;
  },

  getCategories: async (): Promise<TransactionCategory[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<TransactionCategory[]>('/finance/categories');
    return response.data;
  },

  createCategory: async (data: TransactionCategoryCreate): Promise<TransactionCategory> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        name: data.name,
        icon: data.icon || '💰',
        color: data.color || '#10b981',
        type: data.type,
        user_id: 1,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<TransactionCategory>('/finance/categories', data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/finance/categories/${id}`);
    return response.data;
  },

  // Budgets
  getBudgets: async (month: number, year: number): Promise<Budget[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<Budget[]>('/finance/budgets', { params: { month, year } });
    return response.data;
  },

  createBudget: async (data: BudgetCreate): Promise<Budget> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.post<Budget>('/finance/budgets', data);
    return response.data;
  },

  deleteBudget: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/finance/budgets/${id}`);
    return response.data;
  },

  // Debts
  getDebts: async (): Promise<Debt[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<Debt[]>('/finance/debts');
    return response.data;
  },

  createDebt: async (data: DebtCreate): Promise<Debt> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.post<Debt>('/finance/debts', data);
    return response.data;
  },

  updateDebt: async (id: number, data: DebtUpdate): Promise<Debt> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.put<Debt>(`/finance/debts/${id}`, data);
    return response.data;
  },

  deleteDebt: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/finance/debts/${id}`);
    return response.data;
  },

  getGoals: async (): Promise<SavingGoal[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<SavingGoal[]>('/finance/goals');
    return response.data;
  },

  createGoal: async (data: SavingGoalCreate): Promise<SavingGoal> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        title: data.title,
        description: data.description || null,
        target_amount: data.target_amount,
        current_amount: 0,
        deadline: data.deadline || null,
        icon: data.icon || '🎯',
        color: data.color || '#8b5cf6',
        user_id: 1,
        created_at: new Date().toISOString(),
      };
    }
    const response = await api.post<SavingGoal>('/finance/goals', data);
    return response.data;
  },

  updateGoal: async (id: number, data: SavingGoalUpdate): Promise<SavingGoal> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.put<SavingGoal>(`/finance/goals/${id}`, data);
    return response.data;
  },

  deleteGoal: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/finance/goals/${id}`);
    return response.data;
  },

  contributeToGoal: async (goalId: number, data: { amount: number, action: string, note?: string }) => {
    if (USE_MOCK_API) return { success: true, progress_percentage: 10 };
    const response = await api.post(`/finance/goals/${goalId}/contribute`, data);
    return response.data;
  },

  getSummary: async (days: number = 30): Promise<FinanceSummary> => {
    if (USE_MOCK_API) {
      return {
        total_balance: 0,
        total_income: 0,
        total_expense: 0,
        cash_flow_30days: [],
        top_spending_categories: [],
      };
    }
    const response = await api.get<FinanceSummary>(`/finance/summary?days=${days}`);
    return response.data;
  },
};

// Metrics API
export const metricsAPI = {
  getDailyMetrics: async (params?: {
    start_date?: string;
    end_date?: string;
    metric_type?: string;
  }): Promise<DailyMetric[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<DailyMetric[]>('/metrics/daily', { params });
    return response.data;
  },

  createOrUpdateMetric: async (data: DailyMetricCreate): Promise<DailyMetric> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        user_id: 1,
        date: data.date,
        metric_type: data.metric_type,
        value: data.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const response = await api.post<DailyMetric>('/metrics/daily', data);
    return response.data;
  },

  getMetric: async (date: string, metricType: string): Promise<DailyMetric> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.get<DailyMetric>(`/metrics/daily/${date}/${metricType}`);
    return response.data;
  },

  updateMetric: async (id: number, data: DailyMetricUpdate): Promise<DailyMetric> => {
    if (USE_MOCK_API) throw new Error('Mock not implemented');
    const response = await api.put<DailyMetric>(`/metrics/daily/${id}`, data);
    return response.data;
  },

  deleteMetric: async (id: number) => {
    if (USE_MOCK_API) return { ok: true };
    const response = await api.delete(`/metrics/daily/${id}`);
    return response.data;
  },
};

// Focus API
export const focusAPI = {
  getSessions: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FocusSession[]> => {
    if (USE_MOCK_API) return [];
    const response = await api.get<FocusSession[]>('/metrics/focus', { params });
    return response.data;
  },

  createSession: async (data: FocusSessionCreate): Promise<FocusSession> => {
    if (USE_MOCK_API) {
      return {
        id: Date.now(),
        user_id: 1,
        duration_minutes: data.duration_minutes,
        task_id: data.task_id || null,
        started_at: data.started_at,
        completed_at: new Date().toISOString(),
      };
    }
    const response = await api.post<FocusSession>('/metrics/focus', data);
    return response.data;
  },

  logSession: async (durationMinutes: number, taskId?: number) => {
    if (USE_MOCK_API) {
      return { success: true, duration_minutes: durationMinutes, xp_gained: durationMinutes };
    }
    const response = await api.post('/metrics/focus/log', null, {
      params: { duration_minutes: durationMinutes, ...(taskId && { task_id: taskId }) },
    });
    return response.data;
  },

  getSummary: async (days: number = 7): Promise<FocusSessionSummary> => {
    if (USE_MOCK_API) {
      return {
        total_minutes: 0,
        total_hours: 0,
        total_sessions: 0,
        average_minutes: 0,
        daily_breakdown: [],
        period_days: days,
      };
    }
    const response = await api.get<FocusSessionSummary>(`/metrics/focus/summary?days=${days}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getMetrics: async () => {
    const response = await api.get<{
      total_users: number;
      total_active_users: number;
      total_notes: number;
      total_transactions: number;
    }>('/admin/metrics');
    return response.data;
  },

  getUsers: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get<any[]>(`/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  toggleActive: async (userId: number) => {
    const response = await api.put<{ success: boolean; message: string; is_active: boolean }>(
      `/admin/users/${userId}/toggle-active`
    );
    return response.data;
  },

  toggleAdmin: async (userId: number) => {
    const response = await api.put<{ success: boolean; message: string; is_admin: boolean }>(
      `/admin/users/${userId}/toggle-admin`
    );
    return response.data;
  },
};