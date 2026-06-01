import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Check,
  Database,
  Download,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import { useAuth } from '../contexts/AuthContext';

type SettingsTab = 'appearance' | 'notifications' | 'security' | 'data';

const TABS = [
  { id: 'appearance' as const, label: 'Giao dien', icon: Palette },
  { id: 'notifications' as const, label: 'Thong bao', icon: Bell },
  { id: 'security' as const, label: 'Bao mat', icon: Shield },
  { id: 'data' as const, label: 'Du lieu', icon: Database },
];

const getStoredBoolean = (key: string, fallback: boolean) => {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  );
  const [glowEnabled, setGlowEnabled] = useState(() => getStoredBoolean('settings-glow', true));
  const [dailyReminder, setDailyReminder] = useState(() => getStoredBoolean('settings-daily-reminder', false));
  const [soundEnabled, setSoundEnabled] = useState(() => getStoredBoolean('settings-sound', true));
  const [statusMessage, setStatusMessage] = useState('');

  const browserNotificationStatus = useMemo(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }, [dailyReminder]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('app-settings-changed'));
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-glow', glowEnabled ? 'on' : 'off');
    localStorage.setItem('settings-glow', String(glowEnabled));
  }, [glowEnabled]);

  useEffect(() => {
    localStorage.setItem('settings-daily-reminder', String(dailyReminder));
    localStorage.setItem('settings-sound', String(soundEnabled));
  }, [dailyReminder, soundEnabled]);

  const showStatus = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(''), 2500);
  };

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      showStatus('Trinh duyet khong ho tro thong bao.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setDailyReminder(true);
      new Notification('TaskFlow', { body: 'Thong bao da duoc bat.' });
      showStatus('Da bat thong bao.');
    } else {
      setDailyReminder(false);
      showStatus('Chua cap quyen thong bao.');
    }
  };

  const exportData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      user,
      local_storage: Object.fromEntries(
        Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)])
      ),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus('Da xuat file du lieu.');
  };

  const clearLocalPreferences = () => {
    if (!confirm('Xoa cac tuy chon cuc bo tren may nay? Tai khoan va du lieu server khong bi xoa.')) return;

    ['theme', 'settings-glow', 'settings-daily-reminder', 'settings-sound'].forEach((key) => {
      localStorage.removeItem(key);
    });
    queryClient.clear();
    setTheme('dark');
    setGlowEnabled(true);
    setDailyReminder(false);
    setSoundEnabled(true);
    showStatus('Da dat lai tuy chon cuc bo.');
  };

  const Toggle = ({
    enabled,
    onClick,
    label,
  }: {
    enabled: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-all ${
        enabled ? 'justify-end bg-cyan-500/25 border-cyan-400/40' : 'justify-start bg-slate-800/70 border-white/10'
      } border`}
      aria-label={label}
      aria-pressed={enabled}
    >
      <span className={`w-4 h-4 rounded-full ${enabled ? 'bg-cyan-300' : 'bg-slate-400'}`} />
    </button>
  );

  return (
    <div className="animate-fade-slide-up max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-white">Cai dat</h1>
        <p className="text-sm text-slate-400">Quan ly giao dien, thong bao, bao mat va du lieu ca nhan.</p>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-400/30 text-cyan-200'
                    : 'hover:bg-white/5 border-transparent text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'appearance' && (
            <GlassCard className="p-6 space-y-6" accentColor="#38bdf8">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg text-cyan-300 flex items-center gap-2">
                  <Palette className="w-5 h-5" /> Giao dien
                </h3>
                <p className="text-xs text-slate-400 mt-1">Doi theme va hieu ung hien thi tren thiet bi nay.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === 'dark' ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 bg-slate-950/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Moon className="w-5 h-5 text-cyan-300" />
                    {theme === 'dark' && <Check className="w-4 h-4 text-cyan-300" />}
                  </div>
                  <p className="font-bold text-sm text-white mt-3">Dark mode</p>
                  <p className="text-[11px] text-slate-400">Nen toi, hop lam viec lau.</p>
                </button>

                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    theme === 'light' ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 bg-slate-950/40 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-5 h-5 text-amber-300" />
                    {theme === 'light' && <Check className="w-4 h-4 text-cyan-300" />}
                  </div>
                  <p className="font-bold text-sm text-white mt-3">Light mode</p>
                  <p className="text-[11px] text-slate-400">Nen sang, de doc ban ngay.</p>
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-200">Hieu ung glow</p>
                  <p className="text-xs text-slate-400">Giam anh sang neu giao dien trong qua nong.</p>
                </div>
                <Toggle enabled={glowEnabled} onClick={() => setGlowEnabled((value) => !value)} label="Toggle glow" />
              </div>
            </GlassCard>
          )}

          {activeTab === 'notifications' && (
            <GlassCard className="p-6 space-y-6" accentColor="#22c55e">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg text-emerald-300 flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Thong bao
                </h3>
                <p className="text-xs text-slate-400 mt-1">Cau hinh nhac viec tren trinh duyet.</p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-200">Nhac viec hang ngay</p>
                  <p className="text-xs text-slate-400">Luu tuy chon va xin quyen thong bao cua trinh duyet.</p>
                </div>
                <Toggle enabled={dailyReminder} onClick={requestNotifications} label="Toggle daily reminder" />
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-sm font-bold text-slate-200">Am thanh nho</p>
                  <p className="text-xs text-slate-400">Dung cho cac phan hoi nhanh trong app.</p>
                </div>
                <Toggle enabled={soundEnabled} onClick={() => setSoundEnabled((value) => !value)} label="Toggle sound" />
              </div>

              <div className="rounded-xl bg-slate-950/40 border border-white/5 p-3 text-xs text-slate-400">
                Trang thai quyen thong bao: <span className="font-bold text-slate-200">{browserNotificationStatus}</span>
              </div>
            </GlassCard>
          )}

          {activeTab === 'security' && (
            <GlassCard className="p-6 space-y-6" accentColor="#818cf8">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg text-indigo-300 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Bao mat tai khoan
                </h3>
                <p className="text-xs text-slate-400 mt-1">Xem thong tin phien dang nhap hien tai.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/40 border border-white/5 p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Email</p>
                  <p className="text-sm font-bold text-white truncate mt-1">{user?.email}</p>
                </div>
                <div className="rounded-xl bg-slate-950/40 border border-white/5 p-4">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Username</p>
                  <p className="text-sm font-bold text-white truncate mt-1">{user?.username}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-400/30 px-4 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Dang xuat khoi thiet bi nay
              </button>
            </GlassCard>
          )}

          {activeTab === 'data' && (
            <GlassCard className="p-6 space-y-6" accentColor="#a78bfa">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-display font-bold text-lg text-violet-300 flex items-center gap-2">
                  <Database className="w-5 h-5" /> Du lieu
                </h3>
                <p className="text-xs text-slate-400 mt-1">Xuat cau hinh cuc bo hoac don cache tren trinh duyet.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={exportData}
                  className="flex items-center gap-3 rounded-xl bg-slate-950/40 border border-white/5 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <Download className="w-5 h-5 text-violet-300" />
                  <span>
                    <span className="block text-sm font-bold text-white">Xuat JSON</span>
                    <span className="block text-xs text-slate-400">Tai ve localStorage va thong tin user.</span>
                  </span>
                </button>

                <button
                  onClick={clearLocalPreferences}
                  className="flex items-center gap-3 rounded-xl bg-slate-950/40 border border-white/5 p-4 text-left hover:bg-white/5 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-cyan-300" />
                  <span>
                    <span className="block text-sm font-bold text-white">Dat lai tuy chon</span>
                    <span className="block text-xs text-slate-400">Khong xoa du lieu tren server.</span>
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (confirm('Xoa cache query hien tai? Du lieu server khong bi xoa.')) {
                    queryClient.clear();
                    showStatus('Da xoa cache hien tai.');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-400/30 px-4 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Xoa cache ung dung
              </button>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
