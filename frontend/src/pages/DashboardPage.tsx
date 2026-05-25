import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Play, Zap, Droplets, Smile, X } from 'lucide-react';
import confetti from 'canvas-confetti';
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
    onSuccess: (data, variables) => {
      if (variables >= 4) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#fb8500', '#ffb703', '#ff9e00']
        });
      }
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dailyMetric', today, 'water'] });
      if (variables >= 8) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#06b6d4', '#60a5fa']
        });
      }
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
            <GlassCard className="h-full p-5 relative overflow-hidden" accentColor="var(--accent-purple)">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-base text-white">Tâm trạng hôm nay</h3>
                  <p className="text-[11px] text-slate-400">Bạn đang cảm thấy thế nào?</p>
                </div>
                <Smile 
                  className={`w-6 h-6 transition-all duration-500 ${
                    moodValue >= 4 ? 'text-emerald-400 rotate-12 scale-110' : moodValue === 3 ? 'text-amber-400' : 'text-rose-500 -rotate-12 scale-110'
                  }`} 
                />
              </div>
              <div className="flex justify-between items-center gap-2 px-1">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isSelected = value === moodValue;
                  const emojis = ['😢', '😕', '😐', '🙂', '😁'];
                  const moodsList = ['Tồi tệ', 'Bất ổn', 'Bình thường', 'Khá tốt', 'Tuyệt vời'];
                  return (
                    <button
                      key={value}
                      onClick={() => updateMood.mutate(value)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl w-14 h-16 transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-400/80 shadow-[0_0_15px_rgba(251,133,0,0.4)] scale-110 -translate-y-1' 
                          : 'bg-slate-950/40 border border-white/5 opacity-60 hover:opacity-100 hover:scale-105 hover:bg-slate-900/60'
                      }`}
                      disabled={updateMood.isPending}
                      title={moodsList[value - 1]}
                    >
                      <span className={`text-2xl transition-transform duration-300 ${isSelected ? 'scale-110 rotate-3' : ''}`}>
                        {emojis[value - 1]}
                      </span>
                      <span className={`text-[9px] font-bold mt-1.5 whitespace-nowrap transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                        {moodsList[value - 1]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {moodValue <= 2 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium leading-relaxed animate-fade-slide-up flex items-start gap-2">
                  <span className="text-sm">✨</span>
                  <p>{moodValue === 1 
                    ? "Không sao cả, ngày mai trời lại sáng! Bạn đã làm rất tốt hôm nay rồi. Hãy hít thở sâu và nghỉ ngơi nhé! 💛"
                    : "Hãy dịu dàng với bản thân một chút. Những ngày giông bão rồi cũng sẽ qua, nhường chỗ cho nắng ấm. Cố lên nhé! 🌤️"
                  }</p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Water Tracker */}
          <div className="col-span-2">
            <GlassCard className="h-full p-5 relative overflow-hidden" accentColor="#3b82f6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white">Nước uống mỗi ngày</h3>
                  <p className="text-[11px] text-slate-400">Mục tiêu: 8 cốc (2 lít) mỗi ngày</p>
                </div>
                <Droplets className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-6 mt-3">
                {/* Visual Cup Container */}
                <div className="relative w-14 h-18 border-2 border-blue-400/30 rounded-b-2xl rounded-t-sm flex items-end justify-center overflow-hidden bg-slate-950/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                  {/* Fluid Level representation */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    style={{ height: `${Math.min((waterCount / 8) * 100, 100)}%` }}
                  />
                  {/* Bubble details */}
                  {waterCount > 0 && (
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <span className="absolute bottom-2 left-3 w-1 h-1 bg-white rounded-full animate-ping" />
                      <span className="absolute bottom-6 right-3 w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      <span className="absolute bottom-10 left-5 w-1 h-1 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                  {/* Text index */}
                  <span className="z-10 font-black text-xs text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)]">
                    {Math.round(Math.min((waterCount / 8) * 100, 100))}%
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{waterCount}</span>
                    <span className="text-xs text-slate-400 font-bold">/ 8 cốc</span>
                  </div>
                  <button
                    onClick={() => updateWater.mutate(waterCount + 1)}
                    className="w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 border border-blue-400 text-xs text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.25)] flex items-center justify-center gap-1.5 cursor-pointer"
                    disabled={updateWater.isPending}
                  >
                    <span>+ Uống 1 cốc</span>
                  </button>
                </div>
              </div>

              {/* Functional Hydration message feedback */}
              <div className="mt-4 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-[10px] text-blue-300 font-semibold leading-relaxed transition-all duration-300 text-center">
                {waterCount === 0 && "💧 Bạn chưa uống cốc nước nào hôm nay. Hãy tiếp nước nhé!"}
                {waterCount > 0 && waterCount < 4 && "⚡ Hít hà... Thật sảng khoái! Hãy giữ cơ thể luôn đủ nước nhé!"}
                {waterCount >= 4 && waterCount < 8 && "🧠 Tuyệt vời! Nước giúp thanh lọc cơ thể và tăng khả năng tập trung!"}
                {waterCount >= 8 && "🌟 Chúc mừng! Bạn đã hoàn thành 100% mục tiêu uống nước hôm nay!"}
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

