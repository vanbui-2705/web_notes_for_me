import GlassCard from '../ui/GlassCard';

export default function SleepWidget() {
  const hours = 7.5;
  const quality = 4; // out of 5

  return (
    <GlassCard
      accentColor="var(--neon-blue)"
      className="animate-fade-slide-up delay-200 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Last Night's Sleep
          </p>
          <div className="flex items-end gap-1.5 mt-1">
            <span
              className="font-display font-black leading-none text-grad-blue-purple"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              {hours}
            </span>
            <span className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>hrs</span>
          </div>
        </div>
        <span className="text-3xl" aria-hidden="true">🌙</span>
      </div>

      {/* Star rating */}
      <div className="flex gap-0.5" aria-label={`Sleep quality: ${quality} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="text-base" aria-hidden="true">
            {i < quality ? '⭐' : '☆'}
          </span>
        ))}
      </div>

      <div
        className="flex items-center gap-2 pt-3"
        style={{ borderTop: '1px solid var(--glass-border)' }}
      >
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(0,180,240,0.12)',
            color: 'var(--neon-blue)',
            border: '1px solid rgba(0,180,240,0.25)',
          }}
        >
          💪 Supercharged!
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Ready to crush it</span>
      </div>
    </GlassCard>
  );
}
