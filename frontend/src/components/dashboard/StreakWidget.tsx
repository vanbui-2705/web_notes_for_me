import GlassCard from '../ui/GlassCard';

export default function StreakWidget() {
  const streak = 15;
  const best = 23;

  return (
    <GlassCard
      accentColor="var(--neon-pink)"
      className="animate-fade-slide-up delay-100 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Current Streak
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span
              className="font-display font-black text-grad-pink-amber leading-none"
              style={{ fontSize: 'clamp(3rem, 5vw, 4rem)' }}
            >
              {streak}
            </span>
            <span className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>days</span>
          </div>
        </div>
        <span className="text-4xl animate-bounce-glow" aria-hidden="true">🔥</span>
      </div>

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--glass-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Best: <strong style={{ color: 'var(--neon-amber)' }}>{best} days</strong> 🏅
        </span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,45,120,0.12)', color: 'var(--neon-pink)', border: '1px solid rgba(255,45,120,0.25)' }}
        >
          On Fire!
        </span>
      </div>
    </GlassCard>
  );
}
