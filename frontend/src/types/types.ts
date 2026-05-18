export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  is_active: boolean;
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
  category?: Category;
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
}

export interface NoteUpdate {
  title?: string;
  content?: string;
  date?: string;
  status?: NoteStatus;
  priority?: number;
  category_id?: number | null;
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