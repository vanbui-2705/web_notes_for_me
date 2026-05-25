import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { CheckCircle2, Circle, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { notesAPI, categoriesAPI, gamificationAPI, focusAPI } from '../lib/apiService';
import type { Note, NoteStatus } from '../types/types';
import GlassCard from '../components/ui/GlassCard';
import { useTaskModal } from '../contexts/TaskModalContext';

export default function DailyPage() {
  const queryClient = useQueryClient();
  const { openModal } = useTaskModal();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [popups, setPopups] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

  // Focus Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const { data: notes = [], refetch } = useQuery<Note[]>({
    queryKey: ['notes', dateString],
    queryFn: () => notesAPI.getAll({ date: dateString }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => gamificationAPI.getUserStats(),
    staleTime: 5 * 60 * 1000,
  });

  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: NoteStatus } }) =>
      notesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const toggleStatus = (id: number, currentStatus: NoteStatus) => {
    updateNote.mutate({
      id,
      data: { status: currentStatus === 'done' ? 'todo' : 'done' },
    });
  };

  const handleTaskComplete = (e: React.MouseEvent, id: number, currentStatus: NoteStatus) => {
    e.stopPropagation();
    
    if (currentStatus !== 'done') {
      // Trigger confetti at mouse position
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#facc15']
      });

      // Show floating popup
      const popupId = Date.now();
      setPopups(prev => [...prev, { id: popupId, x: e.clientX, y: e.clientY - 30, text: '+10 XP!' }]);
      
      // Remove popup after animation completes
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== popupId));
      }, 1000);
    }
    
    toggleStatus(id, currentStatus);
  };

  const logFocusSession = useMutation({
    mutationFn: (minutes: number) => focusAPI.logSession(minutes),
    onSuccess: (data) => {
      alert(`🎉 Tuyệt vời! Bạn đã tập trung ${data.duration_minutes} phút và nhận được +${data.xp_gained} XP!`);
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setTimeLeft(25 * 60);
    },
  });

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      logFocusSession.mutate(25);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completed = notes.filter(n => n.status === 'done').length;
  const total = notes.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colors = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#f97316', '#14b8a6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-slide-up max-w-6xl mx-auto">

      {/* LEFT COLUMN: TIMELINE */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Daily Timeline</h2>
            <p className="text-sm text-slate-400">
              {format(selectedDate, 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              ←
            </button>
            <button
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              →
            </button>
            <button
              className="btn-primary px-4 py-2 text-sm rounded-full ml-2 hover:scale-[1.02] active:scale-95 transition-transform"
              onClick={() => openModal(dateString)}
            >
              + Add Task
            </button>
          </div>
        </div>

        <GlassCard className="p-8">
          <div className="space-y-4">
            {notes.map((note, idx) => (
              <div key={note.id} className="flex gap-6 group">
                <div className="w-20 flex-shrink-0 text-right pt-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                    {note.content || '9:00 AM'}
                  </span>
                </div>
                <div className="flex-1">
                  <div
                    className={`rounded-xl p-4 transition-all cursor-pointer border-l-4 relative overflow-hidden ${note.status === 'done' ? 'opacity-40 grayscale bg-white/5' : 'hover:scale-[1.02] hover:shadow-xl bg-white/10 backdrop-blur-md'}`}
                    style={{
                      borderColor: colors[idx % colors.length],
                      boxShadow: note.status === 'done' ? 'none' : `0 8px 24px ${colors[idx % colors.length]}30`,
                    }}
                    onClick={(e) => handleTaskComplete(e, note.id, note.status)}
                  >
                    {note.status === 'done' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent pointer-events-none" />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 relative z-10 ${note.status === 'done' ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110' : 'border-2 border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(52,211,153,0.5)] hover:bg-emerald-500/10 text-transparent hover:text-emerald-300'}`}
                          onClick={(e) => handleTaskComplete(e, note.id, note.status)}
                        >
                          {note.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 opacity-0 hover:opacity-100" />}
                        </button>
                        <p className={`font-bold text-base transition-all ${note.status === 'done' ? 'line-through text-slate-500' : 'text-white drop-shadow-sm'}`}>
                          {note.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {note.category && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${note.category.color}20`,
                              color: note.category.color,
                              border: `1px solid ${note.category.color}40`,
                            }}
                          >
                            {note.category.name}
                          </span>
                        )}
                        {note.priority > 1 && (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                            P{note.priority}
                          </span>
                        )}
                        {!!note.reward_amount && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-1" title="Tiền thưởng khi hoàn thành">
                            💰 +{note.reward_amount.toLocaleString()}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No tasks for {format(selectedDate, 'MMMM d')}</p>
                <button
                  className="btn-primary px-6 py-2 rounded-full hover:scale-[1.02] active:scale-95 transition-transform"
                  onClick={() => openModal(dateString)}
                >
                  Add your first task
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* RIGHT COLUMN: WIDGETS */}
      <div className="lg:col-span-1 space-y-6">

        {/* Focus Timer */}
        <GlassCard className="flex flex-col items-center justify-center text-center py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Focus Mode
          </p>
          <div className="font-display font-black text-6xl my-4" style={{ color: 'var(--accent-purple)' }}>
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
            >
              {isTimerRunning ? 'Pause' : 'Start'}
            </button>
            {isTimerRunning && (
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  const focusedMins = Math.ceil((25 * 60 - timeLeft) / 60) || 1;
                  logFocusSession.mutate(focusedMins);
                }}
                className="bg-green-500 hover:bg-green-600 text-white flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
                disabled={logFocusSession.isPending}
              >
                {logFocusSession.isPending ? '⏳...' : 'Complete'}
              </button>
            )}
            {timeLeft !== 25 * 60 && !isTimerRunning && (
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(25 * 60);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
              >
                Reset
              </button>
            )}
          </div>
        </GlassCard>

        {/* Current Status */}
        <GlassCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
            <Zap className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-slate-400">Current Status</p>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-sm">Level {userStats ? userStats.level : '1'}</span>
              <span className="text-xs font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                {userStats ? userStats.xp : '0'} XP
              </span>
            </div>
            <div className="progress-track h-1.5 mt-2">
              <div
                className="progress-fill"
                style={{
                  width: `${userStats ? userStats.progress_percentage : 0}%`,
                  background: 'var(--accent-purple)'
                }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Today's Progress */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base text-white">Today's Progress</h3>
            <span className="text-xs font-bold text-purple-600">{progress}%</span>
          </div>

          <div className="progress-track h-3 rounded-full mb-4">
            <div className="progress-fill h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent-purple)' }} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-black">{completed}</p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-black">{total - completed}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Floating Popups Overlay */}
      {popups.map(popup => (
        <div
          key={popup.id}
          className="fixed pointer-events-none z-50 text-xl font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-500 to-yellow-200 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
          style={{
            left: popup.x,
            top: popup.y,
            animation: 'floatUpAndFade 1s ease-out forwards',
          }}
        >
          {popup.text}
        </div>
      ))}
    </div>
  );
}
