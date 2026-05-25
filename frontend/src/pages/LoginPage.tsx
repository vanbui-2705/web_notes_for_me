import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated orbs - Gold glow */}
      <div className="orb w-[500px] h-[500px] -top-48 -left-32 filter blur-[80px] animate-orb-drift-1" style={{ background: 'radial-gradient(circle, rgba(255,183,3,0.22) 0%, transparent 70%)', position: 'absolute' }} />
      <div className="orb w-[400px] h-[400px] -bottom-32 -right-24 filter blur-[80px] animate-orb-drift-2" style={{ background: 'radial-gradient(circle, rgba(251,133,0,0.18) 0%, transparent 70%)', position: 'absolute' }} />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #cc6f00, #ffb703)' }}
          >
            <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Chào mừng trở lại
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Đăng nhập để tiếp tục hành trình ghi chú
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div
          className="glass-card p-8 flex flex-col gap-5 animate-fade-in-up delay-100"
          style={{ borderRadius: 'var(--radius-xl)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
                style={{ background: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <span className="text-base">⚠</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>hoặc</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          {/* Register Link */}
          <a
            href="/register"
            className="w-full py-3.5 flex items-center justify-center text-sm font-semibold rounded-xl transition-all"
            style={{
              background: 'var(--bg-glass)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            Chưa có tài khoản?&nbsp;
            <span style={{ color: 'var(--text-accent)', fontWeight: 700 }}>Đăng ký miễn phí</span>
          </a>
        </div>
      </div>
    </div>
  );
}