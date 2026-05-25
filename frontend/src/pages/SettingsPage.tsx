import GlassCard from '../components/ui/GlassCard';
import { Settings, Shield, Bell, Palette, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="animate-fade-slide-up max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl text-white">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-400">Tùy chỉnh cấu hình và giao diện cá nhân hóa của bạn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-yellow-300 text-sm font-semibold text-left">
            <Palette className="w-4 h-4" />
            <span>Giao diện & Chủ đề</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent text-slate-300 text-sm font-medium text-left transition-colors">
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent text-slate-300 text-sm font-medium text-left transition-colors">
            <Shield className="w-4 h-4" />
            <span>Bảo mật tài khoản</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent text-slate-300 text-sm font-medium text-left transition-colors">
            <Database className="w-4 h-4" />
            <span>Sao lưu dữ liệu</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="font-display font-bold text-lg text-amber-400 flex items-center gap-2">
                <Palette className="w-5 h-5" /> Giao diện & Chủ đề
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cá nhân hóa trải nghiệm màu sắc của ứng dụng.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chủ đề chủ đạo</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-4 rounded-xl bg-slate-950/80 border-2 border-cyan-400 cursor-pointer relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-400/10 rounded-bl-xl flex items-center justify-center">
                      <span className="text-[10px] text-amber-400 font-black">✓</span>
                    </div>
                    <p className="font-bold text-sm text-white">Crystal Ocean</p>
                    <p className="text-[10px] text-yellow-300 font-medium">Hành Thủy (Mặc định)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 opacity-50 cursor-not-allowed">
                    <p className="font-bold text-sm text-slate-400">Forest Ember</p>
                    <p className="text-[10px] text-slate-500 font-medium">Hành Mộc (Sắp ra mắt)</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-200">Hiệu ứng phát sáng Neon (Glow)</p>
                  <p className="text-xs text-slate-400">Hiển thị quầng sáng bao quanh các thẻ và nút bấm.</p>
                </div>
                <div className="w-10 h-6 bg-amber-500/20 border border-amber-400/30 rounded-full p-0.5 cursor-pointer flex items-center justify-end">
                  <div className="w-4 h-4 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

