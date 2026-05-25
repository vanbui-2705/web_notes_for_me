import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import GlassCard from '../ui/GlassCard';

const MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😎', label: 'Focused' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😤', label: 'Stressed' },
  { emoji: '🤩', label: 'Hyped' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🥳', label: 'Celebrating' },
  { emoji: '🤔', label: 'Thinking' },
];

export default function MoodWidget() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tf-mood');
    if (saved) setSelected(saved);
  }, []);

  const handleSelect = (label: string) => {
    setSelected(label);
    localStorage.setItem('tf-mood', label);
    
    // WOW effect
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#c084fc', '#e879f9', '#818cf8'] // purple/pink neon theme
    });
  };

  const currentMood = MOODS.find(m => m.label === selected);

  return (
    <GlassCard
      accentColor="var(--neon-purple)"
      className="animate-fade-slide-up delay-500 flex flex-col gap-3"
    >
      <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
        Mood Check ✨
      </h3>

      {/* 3×3 Grid */}
      <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Select your mood">
        {MOODS.map(({ emoji, label }) => (
          <button
            key={label}
            className={`mood-btn ${selected === label ? 'selected' : ''}`}
            onClick={() => handleSelect(label)}
            role="radio"
            aria-checked={selected === label}
            aria-label={label}
            title={label}
          >
            <span>{emoji}</span>
            <span
              className="text-[10px] font-semibold leading-tight"
              style={{ color: selected === label ? 'var(--neon-purple)' : 'var(--text-muted)' }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Current mood display */}
      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: '1px solid var(--glass-border)' }}
      >
        <span className="text-base">{currentMood?.emoji || '💭'}</span>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {selected
            ? <>Today's vibe: <strong style={{ color: 'var(--neon-purple)' }}>{selected}</strong></>
            : 'How are you feeling?'}
        </p>
      </div>
    </GlassCard>
  );
}
