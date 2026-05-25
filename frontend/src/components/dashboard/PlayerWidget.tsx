import { useState } from 'react';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const TRACKS = [
  { title: 'Lo-fi Beats for Focusing',  artist: 'ChillHop Radio',  duration: '3:42', emoji: '🎧' },
  { title: 'Rainy Day Study Session',   artist: 'Ambient Works',   duration: '5:18', emoji: '🌧️' },
  { title: 'Deep Work Mode',            artist: 'Focus Flow',      duration: '4:07', emoji: '🎯' },
];

interface PlayerWidgetProps {
  className?: string;
}

export default function PlayerWidget({ className = '' }: PlayerWidgetProps) {
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const track = TRACKS[trackIdx];

  const prev = () => setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
  const next = () => setTrackIdx(i => (i + 1) % TRACKS.length);
  const togglePlay = () => setIsPlaying(p => !p);

  return (
    <GlassCard
      className={`animate-fade-slide-up delay-300 flex items-center gap-5 ${className}`}
    >
      {/* Cassette art */}
      <div
        className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl relative"
        style={{
          background: 'var(--grad-blue-purple)',
          boxShadow: isPlaying ? 'var(--glow-purple)' : 'none',
          transition: 'box-shadow 0.4s ease',
        }}
        aria-hidden="true"
      >
        <span className={isPlaying ? 'animate-spin-slow' : ''}>📼</span>
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Now Playing
            </p>
            {/* Marquee when playing */}
            <div className="overflow-hidden" style={{ maxWidth: '100%' }}>
              <p
                className={`text-sm font-bold whitespace-nowrap ${isPlaying ? 'animate-marquee' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {track.emoji} {track.title}
              </p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{track.artist}</p>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {track.duration}
          </span>
        </div>

        {/* Fake progress */}
        <div className="progress-track" style={{ height: 3 }}>
          <div
            className="progress-fill"
            style={{ width: isPlaying ? '42%' : '20%', background: 'var(--grad-blue-purple)', animation: 'none', transition: 'width 0.5s ease' }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-glass)' }}
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            id="btn-play-pause"
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: 'var(--grad-blue-purple)',
              color: '#fff',
              boxShadow: isPlaying ? 'var(--glow-purple)' : 'none',
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying
              ? <Pause className="w-4 h-4" fill="currentColor" />
              : <Play className="w-4 h-4" fill="currentColor" />
            }
          </button>

          <button
            onClick={next}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: 'var(--text-muted)', background: 'var(--bg-glass)' }}
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Track dots */}
          <div className="ml-auto flex gap-1.5">
            {TRACKS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTrackIdx(i)}
                className="rounded-full transition-all hover:scale-125"
                style={{
                  width: i === trackIdx ? 16 : 6,
                  height: 6,
                  background: i === trackIdx ? 'var(--neon-purple)' : 'var(--text-dim)',
                }}
                aria-label={`Track ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
