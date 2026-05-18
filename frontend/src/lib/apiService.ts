import api from './api';
import type {
  User,
  Category,
  Note,
  NoteCreate,
  NoteUpdate,
  Reminder,
  ReminderCreate,
  DailyStats,
} from '../types/types';

// Auth API
export const authAPI = {
  register: async (data: { email: string; username: string; password: string }) => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<{ access_token: string; token_type: string }>('/auth/login', data);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  create: async (data: CategoryCreate) => {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  delete: async (id: number) => {
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
    search?: string;
  }) => {
    const response = await api.get<Note[]>('/notes', { params });
    return response.data;
  },

  create: async (data: NoteCreate) => {
    const response = await api.post<Note>('/notes', data);
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<Note>(`/notes/${id}`);
    return response.data;
  },

  update: async (id: number, data: NoteUpdate) => {
    const response = await api.put<Note>(`/notes/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },

  getDailyStats: async (date: string) => {
    const response = await api.get<DailyStats>(`/notes/stats/daily/${date}`);
    return response.data;
  },
};

// Reminders API
export const remindersAPI = {
  getAll: async (upcoming: boolean = true) => {
    const response = await api.get<Reminder[]>('/reminders', { params: { upcoming } });
    return response.data;
  },

  create: async (data: ReminderCreate) => {
    const response = await api.post<Reminder>('/reminders', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },
};