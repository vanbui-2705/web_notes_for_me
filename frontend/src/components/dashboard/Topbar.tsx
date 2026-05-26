import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Sun, Moon, Check, Trash2, X, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  onHamburgerClick: () => void;
}

export default function Topbar({ onHamburgerClick }: TopbarProps) {
  const { user } = useAuth();
  
  // Theme Toggle State
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Dynamic Avatar State
  const [avatarSeed, setAvatarSeed] = useState(
    user ? (localStorage.getItem(`avatar-seed-${user.id}`) || user.username) : 'Felix'
  );

  useEffect(() => {
    if (user) {
      setAvatarSeed(localStorage.getItem(`avatar-seed-${user.id}`) || user.username);
    }
    const handleAvatarChange = () => {
      if (user) {
        setAvatarSeed(localStorage.getItem(`avatar-seed-${user.id}`) || user.username);
      }
    };
    window.addEventListener('avatar-changed', handleAvatarChange);
    return () => window.removeEventListener('avatar-changed', handleAvatarChange);
  }, [user]);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'role', icon: '🏆', title: 'Quyền quản trị tối cao', text: 'Tài khoản của bạn đã được nâng cấp thành Admin!', time: 'Vừa xong' },
    { id: 2, type: 'water', icon: '💧', title: 'Nhắc nhở tiếp nước', text: 'Hãy giữ cơ thể đủ nước, duy trì uống nước mỗi ngày!', time: '1 giờ trước' },
    { id: 3, type: 'focus', icon: '🔥', title: 'Nhiệm vụ hàng ngày', text: 'Tập trung 25 phút Pomodoro để nhận +50 XP!', time: '3 giờ trước' }
  ]);

  const handleBellClick = () => {
    setShowNotifications(prev => !prev);
    setHasUnread(false);
  };

  const clearNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Click outside to close notifications dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="flex items-center gap-4 px-6 flex-shrink-0 relative z-[999]"
      style={{
        height: 'var(--topbar-h)',
        background: 'transparent',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-2 rounded-xl transition-colors hover:bg-black/5 cursor-pointer"
        onClick={onHamburgerClick}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Welcome Message in Header */}
      <div className="hidden sm:flex items-center gap-2">
        {user?.is_admin && (
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.15)] animate-pulse">
            <Shield className="w-2.5 h-2.5" /> Admin
          </span>
        )}
        <span className="text-xs font-semibold text-slate-400">
          Xin chào, <strong className="text-white font-bold" style={{ color: 'var(--text-primary)' }}>{user?.username || 'Bạn'}</strong>
        </span>
      </div>

      <div className="flex-1" />

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-3 relative" ref={dropdownRef}>
        
        {/* Notification bell */}
        <div className="relative">
          <button 
            onClick={handleBellClick}
            className={`relative p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              showNotifications 
                ? 'bg-slate-900 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Bell className="w-4 h-4" />
            {hasUnread && notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-slate-950 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card z-50 overflow-hidden animate-scale-up">
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">Thông báo</span>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.2 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAllNotifications}
                    className="text-[10px] text-slate-500 hover:text-rose-400 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Xóa tất cả
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 hover:bg-white/5 transition-colors flex gap-2.5 relative group">
                    <span className="text-lg mt-0.5">{notif.icon}</span>
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-[11px] text-white leading-tight">{notif.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug font-medium">{notif.text}</p>
                      <p className="text-[9px] text-slate-500 mt-1.5 font-semibold">{notif.time}</p>
                    </div>
                    <button 
                      onClick={() => clearNotification(notif.id)}
                      className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <Sparkles className="w-8 h-8 text-slate-600 animate-pulse" />
                    <p className="text-xs text-slate-500 font-semibold">Tuyệt vời! Không có thông báo mới.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Moon/Sun) */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all duration-300 cursor-pointer"
          title={theme === 'dark' ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Tối'}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Avatar mini */}
        <img 
          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}&backgroundColor=f1f5f9`} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full border border-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)] ml-1"
        />
      </div>
    </header>
  );
}
