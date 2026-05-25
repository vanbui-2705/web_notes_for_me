import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '../components/ui/GlassCard';
import { Award, Zap, Clock, ShieldCheck, Flame, Trophy, Star, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { gamificationAPI, notesAPI } from '../lib/apiService';
import type { UserStats, Badge, LeaderboardEntry, Note } from '../types/types';

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['userStats'],
    queryFn: () => gamificationAPI.getUserStats(),
    staleTime: 60 * 1000,
  });

  const [selectedSeed, setSelectedSeed] = useState(
    user ? (localStorage.getItem(`avatar-seed-${user.id}`) || user.username) : 'Felix'
  );

  useEffect(() => {
    if (user) {
      setSelectedSeed(localStorage.getItem(`avatar-seed-${user.id}`) || user.username);
    }
  }, [user]);

  const handleAvatarChange = (seed: string) => {
    if (user) {
      localStorage.setItem(`avatar-seed-${user.id}`, seed);
      setSelectedSeed(seed);
      window.dispatchEvent(new Event('avatar-changed')); // Update sidebar/topbar instantly
    }
  };

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => gamificationAPI.getLeaderboard(),
    staleTime: 60 * 1000,
  });

  // Real heatmap: fetch all notes from the database
  const { data: allNotes = [] } = useQuery<Note[]>({
    queryKey: ['notes'],
    queryFn: () => notesAPI.getAll(),
  });

  // Calculate dynamic heatmap of completed tasks over the last 42 days
  const heatmapData = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (41 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const completedOnDay = allNotes.filter(note => {
        if (note.status !== 'done') return false;
        const noteDateStr = note.date.split('T')[0];
        return noteDateStr === dateStr;
      });
      
      const count = completedOnDay.length;
      return count === 0 ? 0 : Math.min(count, 4);
    });
  }, [allNotes]);

  const defaultBadges = [
    { name: 'Early Bird', description: 'Complete a task before 7 AM', icon: '🌅', color: '#ff9800' },
    { name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', color: '#f44336' },
    { name: 'Habit Builder', description: 'Log a habit 10 times', icon: '🏆', color: '#9c27b0' },
    { name: 'Task Slayer', description: 'Complete 50 tasks', icon: '⚔️', color: '#2196f3' },
  ];

  return (
    <div className="animate-fade-slide-up max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl text-white">Your Growth Journey</h1>
        <p className="text-sm text-slate-400">Cultivate your habits, watch your productivity flourish.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN: TREE & HEATMAP ── */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="flex flex-col items-center justify-center py-12">
            <h3 className="font-display font-bold text-lg mb-2 text-white">Productivity Tree</h3>
            <p className="text-sm text-slate-400 mb-8">
              {userStats && userStats.level >= 10 ? 'Thriving and blooming! Excellent work.' : 'Growing strong. Keep earning XP to grow it further.'}
            </p>

            {/* SVG Tree - scales beautifully based on level */}
            <div className="relative w-48 h-48 mb-8">
              {/* Trunk */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-24 bg-[#8B5A2B] rounded-full" />
              {userStats && userStats.level >= 3 && (
                <div className="absolute bottom-8 left-[40%] w-3 h-16 bg-[#8B5A2B] rounded-full -rotate-45 origin-bottom" />
              )}
              {userStats && userStats.level >= 5 && (
                <div className="absolute bottom-12 left-[55%] w-3 h-12 bg-[#8B5A2B] rounded-full rotate-[35deg] origin-bottom" />
              )}

              {/* Leaves (Pastel circles whose size/opacity depends on user level) */}
              <div
                className="absolute top-4 left-4 rounded-full bg-[#a7f3d0] mix-blend-multiply opacity-80 transition-all duration-500"
                style={{
                  width: userStats ? `${Math.min(60 + userStats.level * 2, 90)}px` : '70px',
                  height: userStats ? `${Math.min(60 + userStats.level * 2, 90)}px` : '70px',
                }}
              />
              <div
                className="absolute top-0 right-4 rounded-full bg-[#c7d2fe] mix-blend-multiply opacity-80 transition-all duration-500"
                style={{
                  width: userStats ? `${Math.min(70 + userStats.level * 2, 100)}px` : '80px',
                  height: userStats ? `${Math.min(70 + userStats.level * 2, 100)}px` : '80px',
                }}
              />
              <div
                className="absolute top-12 left-1/2 -translate-x-1/2 rounded-full bg-[#fde68a] mix-blend-multiply opacity-80 transition-all duration-500"
                style={{
                  width: userStats ? `${Math.min(80 + userStats.level * 2, 110)}px` : '90px',
                  height: userStats ? `${Math.min(80 + userStats.level * 2, 110)}px` : '90px',
                }}
              />
            </div>

            <div className="flex gap-16">
              <div className="text-center">
                <p className="font-display font-black text-3xl text-white">{userStats ? userStats.xp : '0'}</p>
                <p className="text-xs font-bold text-slate-400 uppercase">Total XP</p>
              </div>
              <div className="text-center">
                <p className="font-display font-black text-3xl text-white">{userStats ? userStats.badges.length : '0'}</p>
                <p className="text-xs font-bold text-slate-400 uppercase">Badges Earned</p>
              </div>
            </div>
          </GlassCard>

          {/* Activity Heatmap */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white">Activity Heatmap</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                Less <div className="flex gap-1 mx-1">
                  <div className="w-3 h-3 rounded-sm bg-slate-800" />
                  <div className="w-3 h-3 rounded-sm bg-amber-900/40" />
                  <div className="w-3 h-3 rounded-sm bg-amber-600/60" />
                  <div className="w-3 h-3 rounded-sm bg-amber-500" />
                  <div className="w-3 h-3 rounded-sm bg-amber-400" />
                </div> More
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {heatmapData.map((intensity, i) => {
                const colors = ['#1e293b', '#0e7490', '#06b6d4', '#22d3ee', '#22d3ee'];
                return (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-sm transition-transform hover:scale-110 cursor-pointer"
                    style={{ backgroundColor: colors[intensity] }}
                    title={`Activity level: ${intensity}`}
                  />
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT COLUMN: STATS & LEADERBOARD ── */}
        <div className="space-y-6">

          {/* Avatar Changer Widget */}
          <GlassCard className="p-5 flex flex-col items-center border border-white/10" accentColor="var(--accent-pink)">
            <h3 className="font-display font-bold text-sm text-white mb-1.5 self-start">Ảnh đại diện của bạn</h3>
            <p className="text-[10px] text-slate-400 self-start mb-4">Nhấp vào một hình ảnh bên dưới để thay đổi phong cách!</p>
            
            {/* Display active large avatar */}
            <div className="relative w-24 h-24 mb-5 rounded-full border-2 border-amber-500 bg-slate-900/60 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)] group">
              <img
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedSeed}&backgroundColor=f1f5f9`}
                className="w-full h-full rounded-full"
                alt="Active Avatar"
              />
              <span className="absolute bottom-0 right-0 p-1 bg-amber-500 text-white rounded-full border border-slate-950 text-[10px] shadow-lg flex items-center justify-center">
                ✨
              </span>
            </div>

            {/* Avatar Selector Options Carousel */}
            <div className="w-full overflow-x-auto pb-2 flex gap-2.5 px-0.5 justify-start scrollbar-thin scrollbar-thumb-white/10">
              {[
                { name: 'Năng động', seed: 'Felix' },
                { name: 'Dễ thương', seed: 'Aria' },
                { name: 'Cá tính', seed: 'Jack' },
                { name: 'Mơ mộng', seed: 'Luna' },
                { name: 'Tri thức', seed: 'Milo' },
                { name: 'Tự tin', seed: 'Zoe' },
                { name: 'Nhiệt huyết', seed: 'Leo' },
                { name: 'Dịu dàng', seed: 'Bella' },
                { name: 'Hài hước', seed: 'Charlie' },
                { name: 'Đáng yêu', seed: 'Sophia' }
              ].map((opt) => {
                const isCurrent = opt.seed === selectedSeed;
                return (
                  <button
                    key={opt.seed}
                    onClick={() => handleAvatarChange(opt.seed)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500/10 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                        : 'border-white/5 bg-slate-950/40 hover:border-white/20 hover:bg-slate-900/40'
                    }`}
                    title={opt.name}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${opt.seed}&backgroundColor=f1f5f9`}
                      className="w-8 h-8 rounded-full bg-slate-800"
                      alt={opt.name}
                    />
                    <span className={`text-[8px] font-bold mt-1 leading-none ${isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                      {opt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Level Progress */}
          <GlassCard>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-xl text-white">Level {userStats ? userStats.level : '1'}</h3>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
                {userStats && userStats.level >= 15 ? 'Productivity Titan' : userStats && userStats.level >= 8 ? 'Ambition Ninja' : 'Starter Guild'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{userStats ? userStats.xp : '0'} XP earned</span>
              <span>{userStats ? userStats.xp_to_next_level : '0'} XP left to next level</span>
            </div>
            <div className="progress-track h-2.5 mb-6">
              <div
                className="progress-fill h-full rounded-full transition-all duration-500"
                style={{ width: `${userStats ? userStats.progress_percentage : 0}%`, background: 'var(--accent-cyan)' }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-slate-950/40 rounded-xl p-3 text-center border border-white/10">
                <Zap className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Tier</p>
                <p className="font-bold text-sm text-white">{userStats && userStats.level >= 10 ? 'Elite' : 'Explorer'}</p>
              </div>
              <div className="flex-1 bg-slate-950/40 rounded-xl p-3 text-center border border-white/10">
                <Award className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">XP Multiplier</p>
                <p className="font-bold text-sm text-white">x{(userStats ? 1.0 + (userStats.level * 0.05) : 1.0).toFixed(1)}</p>
              </div>
            </div>
          </GlassCard>

          {/* Badges Widget */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white">Earned Badges</h3>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {userStats?.badges.map((badge: Badge, idx) => (
                <div key={badge.id} className="flex flex-col items-center group relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm text-xl transition-transform hover:scale-110"
                    style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}
                  >
                    {badge.icon}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 leading-tight truncate w-full">{badge.name}</p>

                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap shadow-md pointer-events-none">
                    {badge.description}
                  </div>
                </div>
              ))}

              {(!userStats?.badges || userStats.badges.length === 0) && (
                <div className="col-span-4 text-center py-4 flex flex-col items-center justify-center">
                  <p className="text-xs text-slate-400">Complete tasks to unlock these badges:</p>
                  <div className="grid grid-cols-4 gap-2 mt-3 w-full">
                    {defaultBadges.map((badge, i) => (
                      <div key={i} className="opacity-40 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg mb-1">
                          {badge.icon}
                        </div>
                        <p className="text-[8px] font-semibold text-slate-500 leading-none">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Leaderboard */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white">Leaderboard</h3>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-4">
              {leaderboard.map((entry: LeaderboardEntry, idx) => {
                const isMe = entry.username === 'You' || (user && entry.username === user.username) || idx === 2;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      isMe ? 'bg-amber-500/10 border border-amber-500/30 -mx-2' : ''
                    }`}
                  >
                    <span className={`text-xs font-bold w-4 text-center ${
                      idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${isMe ? selectedSeed : entry.username}&backgroundColor=f1f5f9`}
                      className={`w-8 h-8 rounded-full ${isMe ? 'bg-slate-800 shadow-sm border border-amber-500/30' : 'bg-slate-800'}`}
                      alt="Avatar"
                    />
                    <span className={`text-sm flex-1 ${isMe ? 'font-bold text-cyan-300' : 'font-semibold text-slate-300'}`}>
                      {entry.username} {isMe && '(You)'}
                    </span>
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">{entry.xp.toLocaleString()} XP</p>
                      <p className="text-[9px] font-bold text-amber-400">Lvl {entry.level}</p>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <div className="space-y-3">
                  {/* Mock leaderboard fallback */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-amber-400 w-4 text-center">1</span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">👑</div>
                    <span className="text-sm font-semibold text-slate-300 flex-1">Alex M.</span>
                    <span className="text-xs font-bold text-slate-400">2,450 XP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4 text-center">2</span>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">⚡</div>
                    <span className="text-sm font-semibold text-slate-300 flex-1">Sam K.</span>
                    <span className="text-xs font-bold text-slate-400">1,820 XP</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 -mx-2">
                    <span className="text-xs font-bold text-amber-400 w-4 text-center">3</span>
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedSeed}&backgroundColor=f1f5f9`}
                      className="w-8 h-8 rounded-full bg-slate-800 shadow-sm border border-cyan-500/30"
                      alt="Avatar"
                    />
                    <span className="text-sm font-bold text-cyan-300 flex-1">You</span>
                    <span className="text-xs font-bold text-cyan-300">{userStats ? userStats.xp : '0'} XP</span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

