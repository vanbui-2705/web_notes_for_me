import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Play, Zap, Droplets, Smile, X } from 'lucide-react';
import { notesAPI, metricsAPI, habitsAPI, gamificationAPI, focusAPI } from '../lib/apiService';
import type { Note, Habit, DailyMetric } from '../types/types';

import StreakWidget from '../components/dashboard/StreakWidget';
import QuoteWidget from '../components/dashboard/QuoteWidget';
import HabitWidget from '../components/dashboard/HabitWidget';
import GlassCard from '../components/ui/GlassCard';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Focus Timer States
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', today],
    queryFn: () => notesAPI.getAll({ date: today }),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => gamificationAPI.getUserStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => habitsAPI.getAll(),
  });

  const { data: moodMetric } = useQuery<DailyMetric>({
    queryKey: ['dailyMetric', today, 'mood'],
    queryFn: async () => {
      try {
        return await metricsAPI.getMetric(today, 'mood');
      } catch (err) {
        // Fallback safely if metric not found yet
        return { value: '3' } as unknown as DailyMetric;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: waterMetric } = useQuery<DailyMetric>({
    queryKey: ['dailyMetric', today, 'water'],
    queryFn: async () => {
      try {
        return await metricsAPI.getMetric(today, 'water');
      } catch (err) {
        // Fallback safely if metric not found yet
        return { value: '0' } as unknown as DailyMetric;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const totalNotes = notes.length;
  const doneNotes = notes.filter(n => n.status === 'done').length;
  const progressPct = totalNotes > 0 ? Math.round((doneNotes / totalNotes) * 100) : 0;

  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    icon: '🧘',
    color: '#a78bfa',
  });

  const createHabit = useMutation({
    mutationFn: (data: typeof newHabit) => habitsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setShowAddHabitModal(false);
      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        icon: '🧘',
        color: '#a78bfa',
      });
    },
  });

  const toggleHabitCheck = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
      if (isCompleted) {
        return habitsAPI.uncheck(id);
      } else {
        return habitsAPI.checkIn(id);
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      if (data && data.xp_gained) {
        alert(`🎉 Thói quen đã được check-in! Bạn nhận được +${data.xp_gained} XP!`);
      }
    },
  });

  const deleteHabit = useMutation({
    mutationFn: (id: number) => habitsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  const updateMood = useMutation({
    mutationFn: (value: number) =>
      metricsAPI.createOrUpdateMetric({ date: today, metric_type: 'mood', value: String(value) }),
    onMutate: async (newVal) => {
      await queryClient.cancelQueries({ queryKey: ['dailyMetric', today, 'mood'] });
      const previous = queryClient.getQueryData(['dailyMetric', today, 'mood']);
      queryClient.setQueryData(['dailyMetric', today, 'mood'], { value: String(newVal) });
      return { previous };
    },
    onError: (err, newVal, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dailyMetric', today, 'mood'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMetric', today, 'mood'] });
    },
  });

  const updateWater = useMutation({
    mutationFn: (value: number) =>
      metricsAPI.createOrUpdateMetric({ date: today, metric_type: 'water', value: String(value) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMetric', today, 'water'] });
    },
  });

  const logFocusSession = useMutation<any, Error, number>({
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

  const waterCount = waterMetric?.value ? parseInt(waterMetric.value, 10) : 0;
  const moodValue = moodMetric?.value ? parseInt(moodMetric.value, 10) : 3;


  return (
    <div className="space-y-6 animate-fade-slide-up max-w-5xl mx-auto">
      
      {/* ── HERO ROW: Daily Progress & Level ── */}
      <GlassCard className="flex flex-col md:flex-row items-center gap-6 py-8">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display font-bold text-xl">Daily Progress</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You're doing great today.</p>
            </div>
            <span className="font-display font-black text-3xl" style={{ color: 'var(--accent-purple)' }}>
              {progressPct}%
            </span>
          </div>
          <div className="progress-track h-3 rounded-full">
            <div className="progress-fill h-full" style={{ width: `${progressPct}%`, background: 'var(--accent-purple)' }} />
          </div>
        </div>

        {/* User Level Badge */}
        {userStats && (
          <div className="flex items-center gap-3 md:border-l md:pl-6 md:border-gray-200">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Level</p>
              <p className="font-bold text-lg">{userStats.level}</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* ── WIDGETS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Row 1 */}
        <HabitWidget habits={habits} className="col-span-1 md:col-span-4" />

        {/* Focus Mode Widget */}
        <div className="col-span-1 md:col-span-4">
          <GlassCard className="h-full flex flex-col justify-between items-center text-center py-6">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Focus Mode
            </p>
            <div className="font-display font-black text-5xl my-2" style={{ color: 'var(--text-primary)' }}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
              {isTimerRunning ? '🔥 Đang tập trung...' : timeLeft === 0 ? 'Hoàn thành!' : 'Ready'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="btn-primary flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95"
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
                  className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95"
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
                  className="bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95"
                >
                  Reset
                </button>
              )}
            </div>
          </GlassCard>
        </div>

        <QuoteWidget className="col-span-1 md:col-span-4" />

        {/* Row 2 */}
        <div className="col-span-1 md:col-span-6">
          <GlassCard className="h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base">Today's Habits</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 font-bold px-2.5 py-1 rounded-full transition-colors"
                >
                  + Add Habit
                </button>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{habits.length} habits</span>
              </div>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-all ${
                    habit.is_completed_today ? 'bg-green-50/40 border-l-[3px] border-green-500' : 'border-l-[3px]'
                  }`}
                  style={habit.is_completed_today ? {} : { borderLeftColor: habit.color }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${habit.color}20` }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${habit.is_completed_today ? 'line-through text-gray-400' : ''}`}>
                      {habit.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      🔥 {habit.current_streak} ngày liên tiếp {habit.description ? `• ${habit.description}` : ''}
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleHabitCheck.mutate({ id: habit.id, isCompleted: !!habit.is_completed_today })}
                      className={`p-1.5 rounded-lg transition-colors ${
                        habit.is_completed_today 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={habit.is_completed_today ? 'Hủy check-in' : 'Hoàn thành thói quen'}
                      disabled={toggleHabitCheck.isPending}
                    >
                      <span className="text-sm font-bold">
                        {habit.is_completed_today ? '✓' : '◯'}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Bạn chắc chắn muốn xóa thói quen "${habit.title}"?`)) {
                          deleteHabit.mutate(habit.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Xóa thói quen"
                      disabled={deleteHabit.isPending}
                    >
                      <span className="text-xs font-bold">✕</span>
                    </button>
                  </div>
                </div>
              ))}
              {habits.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-2">Chưa có thói quen nào</p>
                  <button
                    onClick={() => setShowAddHabitModal(true)}
                    className="text-xs bg-purple-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Tạo thói quen đầu tiên
                  </button>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="col-span-1 md:col-span-6 grid grid-cols-2 gap-4">
          {/* Mood Tracker */}
          <div className="col-span-2">
            <GlassCard className="h-full p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-base">How are you feeling?</h3>
                <Smile className="w-5 h-5" style={{ color: moodValue >= 4 ? '#10b981' : moodValue === 3 ? '#fbbf24' : '#ef4444' }} />
              </div>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => updateMood.mutate(value)}
                    className="w-10 h-10 rounded-full text-xl transition-transform hover:scale-110"
                    style={{
                      background: value === moodValue ? 'var(--accent-purple)' : 'gray',
                      color: value === moodValue ? 'white' : 'white',
                    }}
                    disabled={updateMood.isPending}
                  >
                    {['😢', '😕', '😐', '🙂', '😁'][value - 1]}
                  </button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Water Tracker */}
          <div className="col-span-2">
            <GlassCard className="h-full p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-base">Water Intake</h3>
                <Droplets className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-3xl font-black">{waterCount}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>cups today</p>
                </div>
                <button
                  onClick={() => updateWater.mutate(waterCount + 1)}
                  className="px-6 py-3 rounded-xl font-bold transition-colors hover:bg-blue-500"
                  style={{ background: '#3b82f6', color: 'white' }}
                  disabled={updateWater.isPending}
                >
                  + Add Cup
                </button>
              </div>
            </GlassCard>
          </div>
        </div>

      </div>

      {/* Add Habit Modal */}
      {showAddHabitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-950/80 text-white border border-amber-500/20 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-white">Tạo Thói Quen Mới</h3>
              <button onClick={() => setShowAddHabitModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Tên thói quen</label>
                <input
                  type="text"
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="Ví dụ: Đọc sách, Chạy bộ, Học Tiếng Anh..."
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Mô tả ngắn</label>
                <input
                  type="text"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  placeholder="Ví dụ: Đọc 10 trang sách mỗi ngày"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Tần suất</label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  >
                    <option value="daily">Mỗi ngày</option>
                    <option value="weekly">Mỗi tuần</option>
                    <option value="monthly">Mỗi tháng</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Emoji biểu tượng</label>
                  <select
                    value={newHabit.icon}
                    onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                    className="input-field mt-1 w-full p-2.5 border rounded-xl"
                  >
                    {['🧘', '🏋️', '📚', '💻', '💧', '🍎', '🧘', '🚶', '🏃', '🍳', '😴', '✏️', '💊', '🎸', '🌱'].map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Màu sắc</label>
                <div className="flex gap-2.5 mt-1.5 flex-wrap">
                  {['#a78bfa', '#f472b6', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#38bdf8', '#4ade80'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: newHabit.color === color ? '#ffffff' : 'transparent',
                        boxShadow: newHabit.color === color ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-medium hover:bg-white/5 border border-white/10 text-slate-300 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newHabit.title.trim()) {
                      createHabit.mutate(newHabit);
                    }
                  }}
                  className="flex-1 btn-primary py-2.5 rounded-xl font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-yellow-300 border border-amber-500/30 transition-all"
                  disabled={createHabit.isPending || !newHabit.title.trim()}
                >
                  {createHabit.isPending ? 'Đang tạo...' : 'Tạo thói quen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

