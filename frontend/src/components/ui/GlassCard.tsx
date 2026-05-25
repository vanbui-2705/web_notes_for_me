import type { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  accentColor?: string;
}

export default function GlassCard({ children, className = '', style, onClick }: GlassCardProps) {
  return (
    <div
      className={`glass-card p-6 relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
