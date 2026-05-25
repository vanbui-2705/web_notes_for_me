import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, CheckCircle2, Circle, ChevronLeft, ChevronRight, Sparkles, Calendar, Trash2, Target } from 'lucide-react';
import confetti from 'canvas-confetti';
import { notesAPI, categoriesAPI } from '../lib/apiService';
import type { Note, NoteStatus } from '../types/types';
import GlassCard from '../components/ui/GlassCard';

export default function MonthlyPage() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [popups, setPopups] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

  // Monthly Goals (Local Storage for now)
  const monthKey = format(currentMonth, 'yyyy-MM');
  const [monthlyGoals, setMonthlyGoals] = useState<{id: string, text: string, done: boolean}[]>([]);
  const [newGoalText, setNewGoalText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`monthly_goals_${monthKey}`);
    if (saved) {
      setMonthlyGoals(JSON.parse(saved));
    } else {
      setMonthlyGoals([]);
    }
  }, [monthKey]);

  const saveGoals = (goals: typeof monthlyGoals) => {
    setMonthlyGoals(goals);
    localStorage.setItem(`monthly_goals_${monthKey}`, JSON.stringify(goals));
  };

  const toggleGoal = (id: string) => {
    saveGoals(monthlyGoals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      saveGoals([...monthlyGoals, { id: Date.now().toString(), text: newGoalText.trim(), done: false }]);
      setNewGoalText('');
    }
  };

  const deleteGoal = (id: string) => {
    saveGoals(monthlyGoals.filter(g => g.id !== id));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Starts Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // API Queries
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => notesAPI.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  // Notes update mutation
  const updateNote = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { status: NoteStatus } }) =>
      notesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const toggleStatus = (noteId: number, currentStatus: NoteStatus) => {
    updateNote.mutate({
      id: noteId,
      data: { status: currentStatus === 'done' ? 'todo' : 'done' },
    });
  };

  const handleTaskComplete = (e: React.MouseEvent, id: number, currentStatus: NoteStatus) => {
    e.stopPropagation();
    
    if (currentStatus !== 'done') {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#facc15']
      });

      const popupId = Date.now();
      setPopups(prev => [...prev, { id: popupId, x: e.clientX, y: e.clientY - 30, text: '+10 XP!' }]);
      
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== popupId));
      }, 1000);
    }
    
    toggleStatus(id, currentStatus);
  };

  // Delete note mutation
  const deleteNote = useMutation({
    mutationFn: (id: number) => notesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Fast inline task creation form state
  const [inlineTaskTitle, setInlineTaskTitle] = useState('');
  const [inlinePriority, setInlinePriority] = useState('1');
  const [inlineCategory, setInlineCategory] = useState('');

  const createNote = useMutation({
    mutationFn: (data: { title: string; date: string; category_id?: number | null; priority?: number }) =>
      notesAPI.create({
        title: data.title,
        content: '',
        date: data.date,
        status: 'todo',
        priority: data.priority || 1,
        category_id: data.category_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setInlineTaskTitle('');
      setInlineCategory('');
      setInlinePriority('1');
    },
  });

  const handleInlineAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineTaskTitle.trim()) {
      const targetDateStr = format(selectedDate, 'yyyy-MM-dd');
      createNote.mutate({
        title: inlineTaskTitle,
        date: `${targetDateStr}T09:00:00`,
        category_id: inlineCategory ? parseInt(inlineCategory, 10) : null,
        priority: parseInt(inlinePriority, 10),
      });
    }
  };

  // Notes filtering for current Month view
  const monthNotes = allNotes.filter(note => {
    if (!note.date) return false;
    const noteDate = new Date(note.date);
    return noteDate.getMonth() === currentMonth.getMonth() && noteDate.getFullYear() === currentMonth.getFullYear();
  });

  // Stats calculation
  const completedCount = monthNotes.filter(n => n.status === 'done').length;
  const totalCount = monthNotes.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Find busiest day
  const dateCounts = monthNotes.reduce((acc, note) => {
    const d = note.date?.slice(0, 10);
    if (d) acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const busiestDateStr = Object.keys(dateCounts).sort((a, b) => dateCounts[b] - dateCounts[a])[0];
  const busiestCount = busiestDateStr ? dateCounts[busiestDateStr] : 0;

  // Selected date notes
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateNotes = allNotes.filter(n => n.date?.slice(0, 10) === selectedDateStr);

  const colors = ['#ffb703', '#fb8500', '#ff9e00', '#cc8400', '#fbbf24'];

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'GẤP';
    if (priority === 3) return 'VỪA';
    return 'CHILL';
  };

  const getPriorityColorClass = (priority: number) => {
    if (priority >= 4) return 'bg-red-500/10 text-red-400 border border-red-500/20';
    if (priority === 3) return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  return (
    <div className="space-y-6 animate-fade-slide-up max-w-7xl mx-auto px-4 pb-12 overflow-y-auto h-full hide-scrollbar">
      
      {/* ── 1. HEADER ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
            {format(currentMonth, 'MMMM yyyy', { locale: vi })}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Tổng quan công việc theo tháng</p>
        </div>

        {/* Calendar Navigators */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/60 border border-white/5 hover:border-white/10 hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            title="Tháng trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900/60 border border-white/5 hover:border-white/10 hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            title="Tháng sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          {/* Quick jump to today */}
          <button
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 hover:border-amber-500/20 transition-all text-xs font-bold text-slate-300"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
          >
            Hôm nay
          </button>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN SPLIT LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT COLUMN: CALENDAR GRID ================= */}
        <div className="lg:col-span-8">
          <GlassCard className="p-5">
            {/* Weekday headers shorthand */}
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-black uppercase py-2 text-slate-500 tracking-widest"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, idx) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                
                const dayNotes = allNotes.filter(n => n.date?.slice(0, 10) === format(day, 'yyyy-MM-dd'));
                const dayCompleted = dayNotes.filter(n => n.status === 'done');
                const dayPending = dayNotes.filter(n => n.status !== 'done');
                const dayCompletionRate = dayNotes.length > 0 ? dayCompleted.length / dayNotes.length : 0;

                let heatClass = 'bg-slate-950/20 hover:bg-slate-900/40 text-white'; // Default empty
                if (dayNotes.length > 0) {
                  if (dayCompletionRate === 1) {
                    heatClass = 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]'; // All done
                  } else if (dayCompletionRate > 0) {
                    heatClass = 'bg-amber-500/15 border-amber-500/30 hover:bg-amber-500/25 text-amber-100'; // Partial
                  } else {
                    heatClass = 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-100'; // 0%
                  }
                }
                
                if (!isCurrentMonth) {
                  heatClass = 'bg-slate-950/5 opacity-20 text-slate-600 hover:opacity-30 border-transparent';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[90px] p-2.5 rounded-xl border flex flex-col justify-between items-start transition-all focus:outline-none relative group select-none ${heatClass} ${
                      isSelected
                        ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(255,183,3,0.2)] z-10'
                        : isToday
                        ? 'border-amber-500/40 bg-slate-900/60'
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Day Number */}
                    <span className={`text-sm font-black leading-none ${
                      isSelected ? 'text-yellow-300 font-extrabold' : isToday ? 'text-amber-400' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>

                    {/* Indicator dots for tasks inside cell */}
                    <div className="w-full flex items-center justify-start flex-wrap gap-1 mt-2">
                      {/* Completed tasks represented by small green dots */}
                      {dayCompleted.slice(0, 4).map((_, dotIdx) => (
                        <span
                          key={`comp-${dotIdx}`}
                          className="w-1.5 h-1.5 rounded-full bg-green-400 border border-emerald-500/20"
                          title="Đã hoàn thành"
                        />
                      ))}
                      {/* Pending tasks represented by pulsing cyan dots */}
                      {dayPending.slice(0, 4).map((_, dotIdx) => (
                        <span
                          key={`pend-${dotIdx}`}
                          className="w-1.5 h-1.5 rounded-full bg-cyan-400 border border-amber-500/20 animate-pulse"
                          title="Chưa hoàn thành"
                        />
                      ))}
                      
                      {/* More tasks overflow indicator */}
                      {dayNotes.length > 8 && (
                        <span className="text-[8px] font-black text-slate-500 leading-none">
                          +{dayNotes.length - 8}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* ================= RIGHT COLUMN: INSPECTOR & STATS ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* MONTHLY FOCUS GOALS */}
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-20 h-20 text-amber-400" />
            </div>
            <div className="relative z-10">
              <h2 className="font-display font-extrabold text-base text-white flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-amber-400" />
                Mục tiêu trọng tâm tháng
              </h2>
              
              <div className="space-y-2 mb-4">
                {monthlyGoals.map(goal => (
                  <div key={goal.id} className={`flex items-start gap-2 p-2 rounded-lg transition-all ${goal.done ? 'bg-emerald-500/10' : 'bg-slate-900/50'}`}>
                    <button onClick={() => toggleGoal(goal.id)} className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors">
                      {goal.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <span className={`text-sm flex-1 ${goal.done ? 'line-through text-slate-500' : 'text-white'}`}>{goal.text}</span>
                    <button onClick={() => deleteGoal(goal.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {monthlyGoals.length === 0 && (
                  <p className="text-xs text-slate-500 italic">Chưa có mục tiêu nào. Hãy đặt ra vài mục tiêu lớn cho tháng này nhé!</p>
                )}
              </div>

              <form onSubmit={addGoal} className="flex gap-2">
                <input
                  type="text"
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-white/5 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="Thêm mục tiêu tháng..."
                />
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 p-2 rounded-lg font-bold transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </GlassCard>

          {/* DAY INSPECTOR PANEL */}
          <GlassCard className="p-6 flex flex-col min-h-[380px] relative overflow-hidden">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/5 flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-display font-extrabold text-base text-white">
                  Chi tiết ngày
                </h2>
                <p className="text-[11px] text-yellow-300 font-bold uppercase tracking-wider mt-0.5">
                  {format(selectedDate, 'EEEE, d MMMM', { locale: vi })}
                </p>
              </div>
            </div>

            {/* Scrolling list of notes */}
            <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-3 max-h-[220px] scrollbar-thin scrollbar-thumb-slate-800">
              {selectedDateNotes.map((note) => {
                const priorityLabel = getPriorityLabel(note.priority);
                const priorityClass = getPriorityColorClass(note.priority);

                return (
                  <div
                    key={note.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 border bg-slate-950/40 hover:bg-slate-900/60 group ${
                      note.status === 'done'
                        ? 'opacity-40 border-white/5'
                        : 'border-white/5 hover:border-cyan-500/10'
                    }`}
                  >
                    {/* Completion checkbox toggle WOW */}
                    <button 
                      className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 relative z-10 ${note.status === 'done' ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-110' : 'border-2 border-emerald-500/50 hover:border-emerald-400 hover:shadow-[0_0_8px_rgba(52,211,153,0.5)] hover:bg-emerald-500/10 text-transparent hover:text-emerald-300'}`}
                      onClick={(e) => handleTaskComplete(e, note.id, note.status)}
                    >
                      {note.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 opacity-0 hover:opacity-100" />}
                    </button>

                    {/* Task Title and Badge */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold text-white truncate ${
                        note.status === 'done' ? 'line-through text-slate-500' : ''
                      }`}>
                        {note.title}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${priorityClass}`}>
                          {priorityLabel}
                        </span>
                        {note.category && (
                          <span
                            className="text-[8px] font-bold px-1.5 py-0.2 rounded-full"
                            style={{
                              backgroundColor: `${note.category.color}15`,
                              color: note.category.color,
                              border: `1px solid ${note.category.color}25`
                            }}
                          >
                            {note.category.name.toUpperCase()}
                          </span>
                        )}
                        {!!note.reward_amount && (
                          <span className="text-[8px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            💰 +{note.reward_amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button
                      onClick={() => {
                        if (confirm(`Xóa nhiệm vụ "${note.title}"?`)) {
                          deleteNote.mutate(note.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {selectedDateNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-slate-500 text-xs">Không có nhiệm vụ nào được lên lịch.</p>
                </div>
              )}
            </div>

            {/* Quick Inline Creation Form */}
            <form onSubmit={handleInlineAddTask} className="border-t border-white/5 pt-4 mt-auto flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inlineTaskTitle}
                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                  className="flex-1 text-xs bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="Thêm nhanh nhiệm vụ..."
                  disabled={createNote.isPending}
                />
                <button
                  type="submit"
                  className="px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-yellow-300 border border-amber-500/20 rounded-xl transition-all"
                  disabled={createNote.isPending || !inlineTaskTitle.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Advanced toggle inputs row */}
              {inlineTaskTitle.trim() && (
                <div className="flex gap-2 animate-fade-in">
                  <select
                    value={inlinePriority}
                    onChange={(e) => setInlinePriority(e.target.value)}
                    className="text-[10px] w-1/2 p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-white/5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="1">Ưu tiên: Thấp</option>
                    <option value="3">Ưu tiên: Trung bình</option>
                    <option value="4">Ưu tiên: Cao</option>
                  </select>
                  <select
                    value={inlineCategory}
                    onChange={(e) => setInlineCategory(e.target.value)}
                    className="text-[10px] w-1/2 p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-white/5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Không có danh mục</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </form>
          </GlassCard>

          {/* MONTHLY SUMMARY METRICS */}
          <GlassCard className="p-5 grid grid-cols-2 gap-4">
            <h2 className="col-span-2 font-display font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-1">
              Thống kê tháng này
            </h2>

            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng số việc</span>
              <p className="text-2xl font-black text-white mt-1 leading-none">{totalCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hoàn thành</span>
              <p className="text-2xl font-black text-emerald-400 mt-1 leading-none">{completedCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đang chờ xử lý</span>
              <p className="text-2xl font-black text-yellow-400 mt-1 leading-none">{totalCount - completedCount}</p>
            </div>

            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-3.5 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tỉ lệ đạt được</span>
              <p className="text-2xl font-black text-amber-400 mt-1 leading-none">{completionRate}%</p>
            </div>

            {/* Smart Insights Footer */}
            {busiestDateStr && (
              <div className="col-span-2 mt-2 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Smart Insight</h4>
                  <p className="text-sm text-slate-300 mt-1">
                    Ngày bận rộn nhất của bạn là <strong>{format(new Date(busiestDateStr), 'dd/MM/yyyy')}</strong> với <strong>{busiestCount}</strong> công việc. 
                    {completionRate > 70 ? ' Tháng này bạn làm việc rất hiệu quả!' : ' Hãy cố gắng hoàn thành nốt các việc dang dở nhé!'}
                  </p>
                </div>
              </div>
            )}
          </GlassCard>

        </div>

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
