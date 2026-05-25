interface ProgressRingProps {
  percent: number;   // 0–100
  color: string;     // stroke color
  size?: number;     // svg viewBox size, default 100
  strokeWidth?: number;
  label: string;
  icon: string;      // emoji
  animDelay?: string;
}

export default function ProgressRing({
  percent,
  color,
  size = 100,
  strokeWidth = 6,
  label,
  icon,
  animDelay = '0ms',
}: ProgressRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Background ring */}
          <circle
            className="ring-bg"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          <circle
            className="ring-fill"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              animationDelay: animDelay,
            }}
          />
        </svg>
        {/* Center icon */}
        <span
          className="absolute inset-0 flex items-center justify-center text-xl"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <div className="text-center">
        <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-sm font-black" style={{ color }}>{percent}%</p>
      </div>
    </div>
  );
}
