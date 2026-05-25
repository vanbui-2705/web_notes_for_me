import { useState, useEffect } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const GOAL = 8;

export default function WaterWidget() {
  const [glasses, setGlasses] = useState(() => {
    return parseInt(localStorage.getItem('tf-water') || '4', 10);
  });

  useEffect(() => {
    localStorage.setItem('tf-water', String(glasses));
  }, [glasses]);

  const pct = Math.min((glasses / GOAL) * 100, 100);
  const reached = glasses >= GOAL;

  const add = () => { if (!reached) setGlasses(g => g + 1); };
  const reset = () => setGlasses(0);

  return (
    <GlassCard
      accentColor="var(--neon-teal)"
      className="animate-fade-slide-up delay-200 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
          💧 H2O Tracker
        </h3>
        <span className="text-xs font-bold" style={{ color: 'var(--neon-teal)' }}>
          {glasses} / {GOAL} glasses
        </span>
      </div>

      {/* Water level bar */}
      <div className="progress-track" style={{ height: 10 }}>
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: 'var(--grad-teal-blue)',
            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            animation: 'none', // use inline transition instead
          }}
          role="progressbar"
          aria-valuenow={glasses}
          aria-valuemin={0}
          aria-valuemax={GOAL}
        />
      </div>

      {/* Droplet indicators */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: GOAL }, (_, i) => (
          <span
            key={i}
            className="text-lg transition-all duration-200"
            style={{ opacity: i < glasses ? 1 : 0.2, filter: i < glasses ? 'drop-shadow(0 0 4px var(--neon-teal))' : 'none' }}
            aria-hidden="true"
          >
            💧
          </span>
        ))}
      </div>

      {/* Goal reached message */}
      {reached && (
        <p className="text-xs font-bold text-center animate-fade-in" style={{ color: 'var(--neon-teal)' }}>
          🎉 Hydration goal reached!
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          id="btn-add-water"
          onClick={add}
          disabled={reached}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            background: reached ? 'var(--bg-card)' : 'rgba(0,245,212,0.15)',
            color: 'var(--neon-teal)',
            border: '1px solid rgba(0,245,212,0.3)',
          }}
          aria-label="Add a glass of water"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          Add Glass
        </button>

        <button
          onClick={reset}
          className="p-2.5 rounded-xl transition-all hover:scale-110"
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-muted)',
            border: '1px solid var(--glass-border)',
          }}
          aria-label="Reset water tracker"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </GlassCard>
  );
}
