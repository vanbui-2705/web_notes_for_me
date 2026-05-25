import { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '../lib/apiService';

interface TaskModalContextType {
  isOpen: boolean;
  date: string; // ISO date string YYYY-MM-DD
  openModal: (date?: string) => void;
  closeModal: () => void;
  newTask: { title: string; time: string; category_id: string; priority: string; reward_amount: string };
  setNewTask: (task: any) => void;
  createNote: () => void;
  isCreating: boolean;
}

const TaskModalContext = createContext<TaskModalContextType | null>(null);

export const useTaskModal = () => {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error('useTaskModal must be used within TaskModalProvider');
  return ctx;
};

export const TaskModalProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // today
  const [newTask, setNewTask] = useState({ title: '', time: '9:00 AM', category_id: '', priority: '1', reward_amount: '' });

  const createNoteMutation = useMutation({
    mutationFn: (data: { title: string; time: string; date: string; category_id?: number | null; priority?: number; reward_amount?: number }) =>
      notesAPI.create({
        title: data.title,
        content: data.time,
        date: data.date,
        status: 'todo',
        priority: data.priority || 1,
        category_id: data.category_id,
        reward_amount: data.reward_amount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
      setIsOpen(false);
      setNewTask({ title: '', time: '9:00 AM', category_id: '', priority: '1', reward_amount: '' });
    },
  });

  const parseTimeTo24h = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
  };

  const openModal = (overrideDate?: string) => {
    if (overrideDate) setDate(overrideDate);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const createNote = () => {
    if (newTask.title.trim()) {
      const time24h = parseTimeTo24h(newTask.time);
      const isoDateTime = `${date}T${time24h}`;
      createNoteMutation.mutate({
        title: newTask.title,
        time: newTask.time,
        date: isoDateTime,
        category_id: newTask.category_id ? parseInt(newTask.category_id, 10) : null,
        priority: parseInt(newTask.priority, 10),
        reward_amount: newTask.reward_amount ? parseFloat(newTask.reward_amount) : 0,
      });
    }
  };

  return (
    <TaskModalContext.Provider value={{
      isOpen,
      date,
      openModal,
      closeModal,
      newTask,
      setNewTask,
      createNote: createNote,
      isCreating: createNoteMutation.isPending,
    }}>
      {children}
    </TaskModalContext.Provider>
  );
};
