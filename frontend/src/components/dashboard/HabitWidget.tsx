import GlassCard from '../ui/GlassCard';
import ProgressRing from '../ui/ProgressRing';
import type { Habit } from '../../types/types';

interface HabitWidgetProps {
  habits: Habit[];
  className?: string;
}

export default function HabitWidget({ habits, className = '' }: HabitWidgetProps) {
  // Take up to 4 habits to keep the UI clean
  const displayHabits = habits.slice(0, 4);

  return (
    <GlassCard className={`animate-fade-slide-up delay-400 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          Habit Tracker
        </h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(0,245,212,0.1)',
            color: 'var(--neon-teal)',
            border: '1px solid rgba(0,245,212,0.2)',
          }}
        >
          Today
        </span>
      </div>

      {displayHabits.length > 0 ? (
        <>
          <div className="flex items-center justify-around gap-4 flex-wrap">
            {displayHabits.map((habit, i) => {
              const percent = habit.is_completed_today ? 100 : 0;
              return (
                <ProgressRing
                  key={habit.id}
                  percent={percent}
                  color={habit.color || 'var(--neon-teal)'}
                  icon={habit.icon || '✅'}
                  label={habit.title}
                  size={80}
                  animDelay={`${i * 150}ms`}
                />
              );
            })}
          </div>

          <div
            className="flex items-center justify-center gap-6 mt-5 pt-4 flex-wrap"
            style={{ borderTop: '1px solid var(--glass-border)' }}
          >
            {displayHabits.map((habit) => {
              const percent = habit.is_completed_today ? 100 : 0;
              return (
                <div key={habit.id} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: habit.color || 'var(--neon-teal)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {habit.title}{' '}
                    <strong style={{ color: habit.color || 'var(--neon-teal)' }}>
                      {percent}%
                    </strong>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-2">No habits tracked yet today.</p>
          <p className="text-xs text-gray-400">Add a new habit below to start your streaks! 🚀</p>
        </div>
      )}
    </GlassCard>
  );
}
