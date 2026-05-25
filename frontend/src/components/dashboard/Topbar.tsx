import { Bell, Menu, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface TopbarProps {
  onHamburgerClick: () => void;
}

export default function Topbar({ onHamburgerClick }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header
      className="flex items-center gap-4 px-6 flex-shrink-0"
      style={{
        height: 'var(--topbar-h)',
        background: 'transparent',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        className="lg:hidden p-2 rounded-xl transition-colors hover:bg-black/5"
        onClick={onHamburgerClick}
        style={{ color: 'var(--text-secondary)' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title / Breadcrumb can go here if needed, but keeping it clean for now */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Moon className="w-5 h-5" />
        </button>

        {/* Avatar mini */}
        <img 
          src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f1f5f9" 
          alt="Avatar" 
          className="w-8 h-8 rounded-full border border-gray-200"
        />
      </div>
    </header>
  );
}
