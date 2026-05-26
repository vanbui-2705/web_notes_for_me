import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, eachDayOfInterval, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, CheckCircle2, Circle, X, Play, Pause, RotateCcw, Bell, Sparkles, Trophy, Crown, Shield, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { notesAPI, categoriesAPI, focusAPI, gamificationAPI, metricsAPI } from '../lib/apiService';
import type { Note, NoteStatus } from '../types/types';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../contexts/AuthContext';

export default function WeeklyPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedWeek] = useState(new Date());
  const [activeDayIdx, setActiveDayIdx] = useState(0); // Current active day of the week (0 = Monday, 6 = Sunday)
  
  // Pomodoro Focus Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusSessionsToday, setFocusSessionsToday] = useState(4);

  // Hardcode weekdays shorthand to perfectly match mockup
  const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const activeDay = weekDays[activeDayIdx];
  const activeDayDateStr = format(activeDay, 'yyyy-MM-dd');

  // React Query queries
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => notesAPI.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  const { data: userStats } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => gamificationAPI.getUserStats(),
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => gamificationAPI.getLeaderboard(),
  });

  // Mood integration
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const { data: moodMetric } = useQuery({
    queryKey: ['dailyMetric', todayDateStr, 'mood'],
    queryFn: async () => {
      try {
        return await metricsAPI.getMetric(todayDateStr, 'mood');
      } catch (err) {
        return { value: '3' };
      }
    },
  });

  // Calculate dynamic greeting based on local time
  const [greeting, setGreeting] = useState('Chào buổi sáng');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  // Update Note status mutation
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

  // Focus Timer Logic
  const logFocusSession = useMutation<any, Error, number>({
    mutationFn: (minutes: number) => focusAPI.logSession(minutes),
    onSuccess: (data) => {
      showXpToast(data.xp_gained, `Tập trung xong! +${data.xp_gained} XP`);
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setTimeLeft(25 * 60);
      setFocusSessionsToday(prev => prev + 1);
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

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(25 * 60);
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add note modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('1');

  // Leaderboard modal state
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // XP Toast notification state
  const [xpToast, setXpToast] = useState<{ show: boolean; message: string; xp: number } | null>(null);
  const showXpToast = (xp: number, message: string) => {
    setXpToast({ show: true, message, xp });
    setTimeout(() => setXpToast(null), 3500);
  };

  // Comfort Toast notification state
  const [comfortToast, setComfortToast] = useState<string | null>(null);

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
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      setShowAddModal(false);
      setNewTaskTitle('');
      setSelectedCategory('');
      setSelectedPriority('1');
    },
  });

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      createNote.mutate({
        title: newTaskTitle,
        date: `${activeDayDateStr}T09:00:00`,
        category_id: selectedCategory ? parseInt(selectedCategory, 10) : null,
        priority: parseInt(selectedPriority, 10),
      });
    }
  };

  // Dynamic statistics calculations
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  // Filter notes that fall in this week
  const weekNotes = allNotes.filter(n => {
    if (!n.date) return false;
    const datePart = n.date.slice(0, 10);
    return datePart >= weekStartStr && datePart <= weekEndStr;
  });

  const weekTotal = weekNotes.length;
  const weekCompleted = weekNotes.filter(n => n.status === 'done').length;
  const weekProgressPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  // Determine warrior rank dynamically based on completion
  let warriorRank = 'CHIẾN BINH HẠNG ĐỒNG';
  if (weekProgressPct >= 90) warriorRank = 'CHIẾN BINH HUYỀN THOẠI';
  else if (weekProgressPct >= 60) warriorRank = 'CHIẾN BINH HẠNG VÀNG';
  else if (weekProgressPct >= 30) warriorRank = 'CHIẾN BINH HẠNG BẠC';

  // Calculate notes completed in the last 3 days
  const threeDaysAgo = subDays(new Date(), 3);
  const completedLast3Days = allNotes.filter(n => {
    if (n.status !== 'done' || !n.date) return false;
    const d = new Date(n.date);
    return d >= threeDaysAgo && d <= new Date();
  }).length;

  // Selected day notes
  const activeDayNotes = allNotes.filter(n => n.date?.slice(0, 10) === activeDayDateStr);

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

  const changeMood = useMutation({
    mutationFn: (value: number) =>
      metricsAPI.createOrUpdateMetric({ date: todayDateStr, metric_type: 'mood', value: String(value) }),
    onMutate: async (newVal) => {
      await queryClient.cancelQueries({ queryKey: ['dailyMetric', todayDateStr, 'mood'] });
      const previous = queryClient.getQueryData(['dailyMetric', todayDateStr, 'mood']);
      queryClient.setQueryData(['dailyMetric', todayDateStr, 'mood'], { value: String(newVal) });
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
      } else if (variables <= 2) {
        const msg = variables === 1
          ? "Không sao cả, ngày mai trời lại sáng! Bạn đã làm rất tốt hôm nay rồi. Hãy hít thở sâu và nghỉ ngơi nhé! 💛"
          : "Hãy dịu dàng với bản thân một chút. Những ngày giông bão rồi cũng sẽ qua, nhường chỗ cho nắng ấm. Cố lên nhé! 🌤️";
        setComfortToast(msg);
        setTimeout(() => setComfortToast(null), 5000);
      }
    },
    onError: (err, newVal, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['dailyMetric', todayDateStr, 'mood'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMetric', todayDateStr, 'mood'] });
    },
  });

  const moods = ['😢', '😐', '🙂', '😁', '🔥'];
  // Ensure it dynamically reacts to the optimistic update data
  const activeMoodVal = moodMetric?.value ? parseInt(moodMetric.value, 10) : 3;

  return (
    <div className="space-y-6 animate-fade-slide-up max-w-7xl mx-auto px-4 pb-12 overflow-y-auto h-full hide-scrollbar">
      
      {/* ── 1. WELCOME HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400">
            {greeting}, chiến thần!
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-medium mt-1">
            Sẵn sàng hủy diệt danh sách việc làm chưa?
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mood status selector pill */}
          <div className="flex items-center gap-2.5 bg-slate-950/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-xl transition-all duration-300">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mr-1">Tâm trạng:</span>
            {moods.map((emoji, index) => {
              const isSelected = activeMoodVal === index + 1;
              const moodsList = ['Tồi tệ', 'Bất ổn', 'Bình thường', 'Khá tốt', 'Tuyệt vời'];
              return (
                <button
                  key={index}
                  onClick={() => changeMood.mutate(index + 1)}
                  className={`text-base w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? 'scale-125 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/80 shadow-[0_0_10px_rgba(251,133,0,0.3)] z-10 text-lg' 
                      : 'opacity-40 hover:opacity-100 hover:scale-115 border border-transparent hover:bg-white/5'
                  }`}
                  title={`${moodsList[index]}: ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* Notification Icon */}
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/60 border border-white/5 hover:border-amber-500/30 transition-all hover:scale-105"
            onClick={() => alert("Chuông thông báo: Bạn không có thông báo mới!")}
          >
            <Bell className="w-5 h-5 text-slate-400 hover:text-amber-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* ── 2. WIDGETS RESPONSIVE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* WIDGET 1: TUẦN NÀY CỦA BẠN */}
          <GlassCard className="p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-extrabold text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Tuần này của bạn
              </h2>
              {/* Month Indicator Badge */}
              <span className="bg-amber-500/10 text-yellow-300 border border-amber-500/25 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {format(selectedWeek, 'MMMM, yyyy', { locale: vi })}
              </span>
            </div>

            {/* Horizontal week navigator */}
            <div className="grid grid-cols-7 gap-3 mb-6">
              {weekDays.map((day, idx) => {
                const isActive = activeDayIdx === idx;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const hasTasks = allNotes.some(n => n.date?.slice(0, 10) === format(day, 'yyyy-MM-dd'));

                return (
                  <button
                    key={idx}
                    onClick={() => setActiveDayIdx(idx)}
                    className="flex flex-col items-center focus:outline-none group relative"
                  >
                    {/* Circle Node */}
                    <div
                      className={`w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-300 border ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-400 shadow-[0_0_20px_rgba(255,183,3,0.4)] scale-110'
                          : isToday
                          ? 'bg-slate-900/60 text-amber-400 border-amber-400/50 hover:bg-slate-800'
                          : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">
                        {weekdayLabels[idx]}
                      </span>
                      <span className="text-lg font-black leading-none">
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Active/Task indicator dots */}
                    <div className="h-2 flex items-center justify-center mt-1">
                      {isActive ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping absolute bottom-[-4px]" />
                      ) : hasTasks ? (
                        <span className="w-1 h-1 rounded-full bg-slate-500 group-hover:bg-amber-400/50" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic visual Project Card underneath slider */}
            <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
              {/* Neon Wave Vector Graphics */}
              <div className="w-20 h-20 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <svg className="w-full h-full absolute inset-0 text-amber-500 opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                    fill="url(#wave-grad)"
                  />
                  <path
                    d="M0,50 Q25,20 50,60 T100,40"
                    fill="none"
                    stroke="#ffb703"
                    strokeWidth="2.5"
                    className="animate-pulse"
                  />
                  <defs>
                    <linearGradient id="wave-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,245,212,0.2)" />
                      <stop offset="100%" stopColor="rgba(0,187,249,0)" />
                    </linearGradient>
                  </defs>
                </svg>
                <Sparkles className="w-7 h-7 text-amber-400 drop-shadow-[0_0_6px_rgba(255,183,3,0.8)] relative z-10" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display font-bold text-white text-base">Mục tiêu & Dự án Tiêu Điểm</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Bạn đã hoàn thiện <strong className="text-yellow-300 font-bold">{completedLast3Days} nhiệm vụ</strong> trong 3 ngày vừa qua. Hãy giữ vững phong độ chiến đấu này để đạt kết quả xuất sắc trong tuần nhé!
                </p>
              </div>
            </div>
          </GlassCard>

          {/* WIDGET 2: CHẾ ĐỘ TẬP TRUNG (POMODORO TIMER) */}
          <GlassCard className="p-6 relative overflow-hidden">
            <h2 className="font-display font-extrabold text-xl text-white flex items-center gap-2 mb-6">
              <Play className="w-5 h-5 text-amber-400" />
              Chế độ tập trung
            </h2>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
              
              {/* Massive countdown glowing timer */}
              <div className="flex flex-col items-center">
                <div className="font-display font-black text-6xl md:text-7xl text-white tracking-widest drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] select-none">
                  {formatTimerTime(timeLeft)}
                </div>
                <span className="text-xs text-slate-400 mt-2 font-bold tracking-widest uppercase">
                  {isTimerRunning ? '🔥 Đang chiến đấu tập trung...' : 'Đang tạm dừng'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-row items-center gap-4">
                <button
                  onClick={toggleTimer}
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,183,3,0.3)] group"
                >
                  {isTimerRunning ? (
                    <Pause className="w-6 h-6 text-slate-950 fill-slate-950" />
                  ) : (
                    <Play className="w-6 h-6 text-slate-950 fill-slate-950 pl-1" />
                  )}
                </button>

                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-900 border border-white/5 hover:border-white/20 transition-all hover:scale-105 active:scale-95 text-slate-400 hover:text-white"
                  title="Đặt lại phiên tập trung"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Progress counter tubes */}
              <div className="w-full md:w-64 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Mục tiêu ngày</span>
                  <span className="text-amber-400">{focusSessionsToday}/8 Phiên</span>
                </div>
                {/* Horizontal visual indicator tube */}
                <div className="h-3 bg-slate-950/80 rounded-full border border-white/5 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 shadow-[0_0_10px_rgba(255,183,3,0.5)]"
                    style={{ width: `${Math.min((focusSessionsToday / 8) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* WIDGET 3: CÔNG LỰC */}
          <GlassCard className="p-6 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[300px]">
            <h2 className="font-display font-extrabold text-sm text-slate-400 uppercase tracking-widest mb-4">
              Công lực
            </h2>

            {/* Circular Progress Ring with linear gradient stroke */}
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gold-amber-grad)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * weekProgressPct) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gold-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fb8500" />
                    <stop offset="100%" stopColor="#ffb703" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Inner text inside circle */}
              <div className="absolute flex flex-col items-center">
                <span className="font-display font-black text-3xl text-white">
                  {weekProgressPct}%
                </span>
                {userStats && (
                  <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest mt-0.5">
                    Lvl {userStats.level}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Rank & Status */}
            <div className="mt-4 w-full">
              <h3 className="font-display font-black text-lg text-white">Công lực</h3>
              <p className="text-xs text-yellow-300 font-black tracking-widest mt-1 uppercase flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                {warriorRank}
              </p>
              
              {/* View ranking action button */}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full mt-5 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-bold text-amber-300 hover:text-white hover:bg-amber-500/15 transition-all hover:border-amber-400/40 flex items-center justify-center gap-2"
              >
                <Trophy className="w-3.5 h-3.5" />
                Xem bảng xếp hạng
              </button>
            </div>
          </GlassCard>

          {/* WIDGET 4: NHIỆM VỤ ƯU TIÊN */}
          <GlassCard className="p-6 relative overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="font-display font-extrabold text-base text-white">
                Nhiệm vụ ưu tiên
              </h2>
              {/* Quick Add new note button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs bg-amber-500/10 text-yellow-300 hover:bg-amber-500/20 border border-amber-500/20 font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm mới
              </button>
            </div>

            {/* Task list matching mockup */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
              {activeDayNotes.map((note) => {
                const priorityLabel = getPriorityLabel(note.priority);
                const priorityClass = getPriorityColorClass(note.priority);

                return (
                  <div
                    key={note.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 border bg-slate-950/40 hover:bg-slate-900/60 ${
                      note.status === 'done'
                        ? 'opacity-40 border-white/5'
                        : 'border-white/5 hover:border-amber-500/15'
                    }`}
                  >
                    {/* Checkbox button */}
                    <button
                      onClick={() => toggleStatus(note.id, note.status)}
                      className="text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0"
                    >
                      {note.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-amber-400 fill-amber-400/10" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Task details */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-white truncate ${
                        note.status === 'done' ? 'line-through text-slate-500' : ''
                      }`}>
                        {note.title}
                      </p>
                      
                      {/* Priority and category tags merged styled as pill badges */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${priorityClass}`}>
                          {priorityLabel}
                        </span>
                        
                        {note.category && (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
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
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            💰 +{note.reward_amount.toLocaleString()}đ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeDayNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <p className="text-slate-500 text-sm">Chưa có nhiệm vụ nào cho ngày này.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs text-amber-400 hover:text-yellow-300 font-bold mt-2"
                  >
                    Tạo nhiệm vụ đầu tiên ngay
                  </button>
                </div>
              )}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* ── 3. ADD TASK GLASS MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in">
          <div className="glass-card p-6 w-full max-w-md mx-4 shadow-2xl animate-scale-up border border-white/10 bg-slate-950/90 text-white">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Tạo Nhiệm Vụ Mới
              </h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Tên nhiệm vụ</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="input-field mt-1.5 w-full p-2.5 border rounded-xl"
                  placeholder="Hủy diệt mục tiêu nào tiếp theo?"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Danh mục</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field mt-1.5 w-full p-2.5 border rounded-xl"
                >
                  <option value="">Không có danh mục</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Mức độ ưu tiên</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="input-field mt-1.5 w-full p-2.5 border rounded-xl"
                >
                  <option value="1">Chill (Thấp)</option>
                  <option value="3">Vừa (Trung bình)</option>
                  <option value="4">Gấp (Cao)</option>
                  <option value="5">Khẩn cấp (Rất cao)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-slate-900 border border-white/5 hover:bg-slate-800 transition-colors text-sm text-slate-300"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 btn-primary py-2.5 rounded-xl text-sm"
                  disabled={createNote.isPending || !newTaskTitle.trim()}
                >
                  {createNote.isPending ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── LEADERBOARD MODAL ── */}
      {showLeaderboard && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowLeaderboard(false)}
        >
          <div className="relative w-full max-w-md mx-4 animate-scale-up">
            {/* Glow background */}
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30" style={{ background: 'radial-gradient(ellipse, rgba(255,183,3,0.4) 0%, transparent 70%)' }} />
            
            <div className="relative rounded-3xl p-0 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(20,16,4,0.95), rgba(12,10,2,0.98))',
                border: '1px solid rgba(255,183,3,0.25)',
                boxShadow: '0 0 60px rgba(255,183,3,0.12), 0 30px 60px rgba(0,0,0,0.7)'
              }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, rgba(255,183,3,0.08), transparent)', borderBottom: '1px solid rgba(255,183,3,0.12)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #cc6f00, #ffb703)', boxShadow: '0 4px 15px rgba(255,183,3,0.3)' }}
                  >
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-white">Bảng Xếp Hạng</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,183,3,0.7)' }}>Chiến Thần Tuần Này</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Leaderboard list */}
              <div className="px-6 py-5 space-y-3">
                {leaderboard.map((entry: any, idx: number) => {
                  const isMe = user && entry.username === user.username;
                  
                  let containerStyle: any = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
                  let rankStyle: any = { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' };
                  
                  if (idx === 0) {
                    containerStyle = { background: 'linear-gradient(135deg, rgba(255,183,3,0.12), rgba(255,183,3,0.04))', border: '1px solid rgba(255,183,3,0.25)' };
                    rankStyle = { background: 'linear-gradient(135deg, #ffb703, #ff8c00)', color: '#120a00', border: 'none', boxShadow: '0 0 15px rgba(255,183,3,0.4)' };
                  } else if (idx === 1) {
                    containerStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };
                    rankStyle = { background: 'rgba(251,133,0,0.15)', color: '#fb8500', border: '1px solid rgba(251,133,0,0.3)' };
                  }
                  
                  if (isMe) {
                    containerStyle = {
                      background: 'linear-gradient(135deg, rgba(255,183,3,0.06), rgba(251,133,0,0.04))',
                      border: '2px solid rgba(255,183,3,0.35)',
                      boxShadow: '0 0 20px rgba(255,183,3,0.08)'
                    };
                    rankStyle = { background: 'rgba(255,183,3,0.12)', color: '#fbbf24', border: '1px solid rgba(255,183,3,0.2)' };
                  }

                  return (
                    <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden group" style={containerStyle}>
                      {idx === 0 && <div className="absolute right-3 top-3 text-2xl opacity-10">👑</div>}
                      {isMe && (
                        <div className="absolute -top-2 left-4">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-black"
                            style={{ background: 'linear-gradient(135deg, #ffb703, #ff8c00)' }}>
                            BẠN
                          </span>
                        </div>
                      )}
                      
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0" style={rankStyle}>
                        {idx + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white">{entry.username} {isMe && '(You)'}</p>
                          {idx === 0 && <Crown className="w-3.5 h-3.5" style={{ color: '#ffb703' }} />}
                          {isMe && idx !== 0 && <Shield className="w-3 h-3 text-amber-400" />}
                        </div>
                        <p className="text-[10px]" style={{ color: 'rgba(255,183,3,0.6)' }}>Cấp {entry.level}</p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-base" style={{ color: idx === 0 ? '#ffb703' : isMe ? '#fb8500' : '#e2e8f0' }}>
                          {entry.xp} XP
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {leaderboard.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Chưa có ai trên bảng xếp hạng.</p>
                )}
              </div>

              {/* Footer CTA */}
              <div className="px-6 pb-6">
                <div className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.1)' }}
                >
                  <Zap className="w-4 h-4 mx-auto mb-1" style={{ color: '#ffb703' }} />
                  <p className="text-[11px] text-slate-400">
                    Hoàn thành nhiệm vụ để tăng <span style={{ color: '#ffb703' }} className="font-bold">XP</span> và leo hạng!
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="w-full mt-3 py-2.5 rounded-xl font-bold text-sm btn-primary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── XP TOAST NOTIFICATION ── */}
      {xpToast && (
        <div
          className="fixed bottom-6 right-6 z-[9999] animate-scale-up"
          style={{
            background: 'linear-gradient(135deg, rgba(20,16,4,0.95), rgba(30,22,4,0.98))',
            border: '1px solid rgba(255,183,3,0.35)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(255,183,3,0.2), 0 4px 20px rgba(0,0,0,0.5)',
            padding: '14px 20px',
            minWidth: '240px'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #cc6f00, #ffb703)', boxShadow: '0 0 15px rgba(255,183,3,0.4)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-white">{xpToast.message}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,183,3,0.7)' }}>Tiếp tục làm mạnh lên nào! 💪</p>
            </div>
          </div>
        </div>
      )}

      {/* ── COMFORT TOAST NOTIFICATION ── */}
      {comfortToast && (
        <div
          className="fixed bottom-6 right-6 z-[9999] animate-scale-up max-w-xs"
          style={{
            background: 'linear-gradient(135deg, rgba(20,16,4,0.95), rgba(30,22,4,0.98))',
            border: '1px solid rgba(251,133,0,0.35)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(251,133,0,0.2), 0 4px 20px rgba(0,0,0,0.5)',
            padding: '14px 20px',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #fb8500, #ffb703)', boxShadow: '0 0 15px rgba(251,133,0,0.4)' }}
            >
              <span className="text-xl">✨</span>
            </div>
            <div>
              <p className="font-bold text-[10px] text-amber-400 uppercase tracking-wider">Lời nhắn yêu thương</p>
              <p className="text-[11px] text-white mt-1 leading-relaxed font-medium">{comfortToast}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
