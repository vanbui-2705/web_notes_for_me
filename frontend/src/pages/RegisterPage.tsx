import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Eye, EyeOff, ArrowRight, Loader2, User, Mail, Lock } from 'lucide-react';

const InputWrapper = ({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
      <Icon className="w-3 h-3" />
      {label}
    </label>
    {children}
  </div>
);

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated orbs */}
      <div className="orb w-[500px] h-[500px] -top-48 -right-32 filter blur-[80px] animate-orb-drift-1" style={{ background: 'radial-gradient(circle, rgba(0,245,212,0.2) 0%, transparent 70%)', position: 'absolute' }} />
      <div className="orb w-[350px] h-[350px] bottom-0 -left-24 filter blur-[80px] animate-orb-drift-2" style={{ background: 'radial-gradient(circle, rgba(0,187,249,0.15) 0%, transparent 70%)', position: 'absolute' }} />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #0077b6, #00f5d4)', boxShadow: '0 0 25px rgba(0,245,212,0.3)' }}
          >
            <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Tạo tài khoản mới
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Bắt đầu hành trình ghi chú ngay hôm nay
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card p-7 flex flex-col gap-4 animate-fade-in-up delay-100" style={{ borderRadius: 'var(--radius-xl)' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputWrapper label="Tên hiển thị" icon={User}>
              <input
                id="reg-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Tên của bạn"
                required
                autoFocus
              />
            </InputWrapper>

            <InputWrapper label="Email" icon={Mail}>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </InputWrapper>

            <InputWrapper label="Mật khẩu" icon={Lock}>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </InputWrapper>

            <InputWrapper label="Xác nhận mật khẩu" icon={Lock}>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5" style={{ color: 'var(--text-muted)' }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </InputWrapper>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button
              id="reg-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base mt-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo tài khoản...</>
              ) : (
                <>Tạo tài khoản <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          {/* Login Link */}
          <a
            href="/login"
            className="w-full py-3.5 flex items-center justify-center text-sm font-semibold rounded-xl transition-all"
            style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            Đã có tài khoản?&nbsp;
            <span style={{ color: 'var(--text-accent)', fontWeight: 700 }}>Đăng nhập</span>
          </a>
        </div>
      </div>
    </div>
  );
}