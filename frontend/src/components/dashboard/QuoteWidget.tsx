import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const QUOTES = [
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'One task at a time. That\'s the move.', author: 'Productivity Rule' },
  { text: 'Progress, not perfection.', author: 'Unknown' },
  { text: 'Small steps, big wins.', author: 'Atomic Habits' },
  { text: 'Focus is a superpower.', author: 'Deep Work' },
];

interface QuoteWidgetProps {
  className?: string;
}

export default function QuoteWidget({ className = '' }: QuoteWidgetProps) {
  const [idx, setIdx] = useState(0);

  const nextQuote = () => {
    setIdx(i => {
      let next;
      do { next = Math.floor(Math.random() * QUOTES.length); }
      while (next === i && QUOTES.length > 1);
      return next;
    });
  };

  const { text, author } = QUOTES[idx];

  return (
    <GlassCard
      accentColor="var(--neon-purple)"
      className={`animate-fade-slide-up delay-300 flex flex-col justify-between gap-4 ${className}`}
    >
      <div className="relative">
        <span
          className="absolute -top-2 -left-1 font-display font-black leading-none select-none"
          style={{ fontSize: '4rem', color: 'var(--neon-purple)', opacity: 0.18 }}
          aria-hidden="true"
        >
          "
        </span>
        <p
          className="text-sm font-medium italic leading-relaxed pt-4 relative z-10"
          style={{ color: 'var(--text-primary)' }}
        >
          {text}
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>— {author}</p>
      </div>

      <button
        onClick={nextQuote}
        className="self-end flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
        style={{
          background: 'rgba(177,79,255,0.12)',
          color: 'var(--neon-purple)',
          border: '1px solid rgba(177,79,255,0.25)',
        }}
        aria-label="Show new random quote"
      >
        <RefreshCw className="w-3 h-3" />
        New Quote
      </button>
    </GlassCard>
  );
}
