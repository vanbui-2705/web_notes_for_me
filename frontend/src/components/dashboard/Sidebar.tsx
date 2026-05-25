import { LayoutDashboard, Calendar, CalendarDays, CalendarRange, Wallet, User, Settings, LifeBuoy, Plus, LogOut, Shield } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskModal } from '../../contexts/TaskModalContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, path: '/' },
  { id: 'daily',     label: 'Daily',      icon: Calendar,        path: '/daily' },
  { id: 'weekly',    label: 'Weekly',     icon: CalendarDays,    path: '/weekly' },
  { id: 'monthly',   label: 'Monthly',    icon: CalendarRange,   path: '/monthly' },
  { id: 'finance',   label: 'Finance',    icon: Wallet,          path: '/finance' },
  { id: 'profile',   label: 'Profile',    icon: User,            path: '/profile' },
  { id: 'settings',  label: 'Settings',   icon: Settings,        path: '/settings' },
  { id: 'support',   label: 'Support',    icon: LifeBuoy,        path: '/support' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { openModal } = useTaskModal();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6">
          <span className="font-display font-bold text-xl" style={{ color: 'var(--accent-purple)' }}>
            TaskFlow
          </span>
        </div>

        {/* Profile */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f1f5f9" 
              alt="Avatar" 
              className="w-10 h-10 rounded-full"
            />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user?.username || 'Quietly Ambitious'}</p>
              <p className="text-xs text-muted truncate" style={{ color: 'var(--text-muted)' }}>
                Level 24 Productivity Ninja
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add (Optional, maybe trigger a modal context later) */}
        <div className="px-6 py-4">
          <button
            onClick={() => {
              openModal(); // opens with today's date by default, or DailyPage can set context date
              onClose();
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm rounded-full hover:scale-[1.02] active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Quick Add Task
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 hide-scrollbar">
          {NAV_ITEMS.map(({ id, label, icon: Icon, path }) => (
            <NavLink
              key={id}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `nav-item w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `nav-item w-full text-left ${isActive ? 'active' : ''}`}
            >
              <Shield className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              <span>Admin Dashboard</span>
            </NavLink>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 mt-auto">
          <button
            onClick={logout}
            className="nav-item w-full text-left"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut style={{ width: 18, height: 18 }} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
