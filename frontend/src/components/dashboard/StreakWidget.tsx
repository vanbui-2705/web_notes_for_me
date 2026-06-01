import { Flame, ShieldCheck, Swords } from "lucide-react";
import GlassCard from "../ui/GlassCard";

interface StreakWidgetProps {
  streak?: number;
  best?: number;
  tier?: "spark" | "hot" | "blaze" | "legend";
  className?: string;
}

const TIER_META = {
  spark: {
    label: "Spark",
    message: "Vào app hôm nay để giữ lửa.",
    icon: Flame,
    emoji: "🔥",
    accent: "#38bdf8",
    badgeBg: "rgba(56,189,248,0.12)",
    badgeColor: "#38bdf8",
  },
  hot: {
    label: "On Fire",
    message: "Chuỗi ngày đang nóng lên.",
    icon: Flame,
    emoji: "🔥",
    accent: "#22c55e",
    badgeBg: "rgba(34,197,94,0.12)",
    badgeColor: "#22c55e",
  },
  blaze: {
    label: "Blaze Mode",
    message: "Đang tiến gần đến mốc 100.",
    icon: ShieldCheck,
    emoji: "⚔️",
    accent: "#818cf8",
    badgeBg: "rgba(129,140,248,0.14)",
    badgeColor: "#818cf8",
  },
  legend: {
    label: "Legend 100+",
    message: "Icon chiến đấu đã mở khóa.",
    icon: Swords,
    emoji: "🏆",
    accent: "#a78bfa",
    badgeBg: "rgba(167,139,250,0.16)",
    badgeColor: "#c4b5fd",
  },
};

export default function StreakWidget({
  streak = 0,
  best = 0,
  tier = "spark",
  className = "",
}: StreakWidgetProps) {
  const progressToLegend = Math.min(streak, 100);
  const meta = TIER_META[tier] || TIER_META.spark;
  const Icon = meta.icon;
  const isLegend = streak >= 100 || tier === "legend";

  return (
    <GlassCard
      accentColor={meta.accent}
      className={`animate-fade-slide-up delay-100 flex flex-col gap-3 overflow-hidden relative ${className}`}
    >
      {isLegend && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              "radial-gradient(circle at 85% 10%, rgba(167,139,250,0.38), transparent 32%), radial-gradient(circle at 15% 90%, rgba(56,189,248,0.24), transparent 30%)",
          }}
        />
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Current Streak
          </p>
          <div className="flex items-end gap-2 mt-1">
            <span
              className="font-display font-black text-grad-pink-amber leading-none"
              style={{ fontSize: "clamp(3rem, 5vw, 4rem)" }}
            >
              {streak}
            </span>
            <span
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              days
            </span>
          </div>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isLegend ? "animate-bounce-glow" : ""}`}
          style={{
            background: meta.badgeBg,
            borderColor: meta.badgeColor,
            boxShadow: isLegend ? "0 0 28px rgba(167,139,250,0.28)" : "none",
          }}
          aria-hidden="true"
        >
          {isLegend ? (
            <span className="text-3xl">{meta.emoji}</span>
          ) : (
            <Icon className="w-8 h-8" style={{ color: meta.badgeColor }} />
          )}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Legend unlock
          </span>
          <span
            className="text-[10px] font-bold"
            style={{ color: meta.badgeColor }}
          >
            {progressToLegend}/100
          </span>
        </div>
        <div className="progress-track h-2 rounded-full">
          <div
            className="progress-fill h-full"
            style={{
              width: `${progressToLegend}%`,
              background: isLegend
                ? "linear-gradient(90deg, #38bdf8, #818cf8, #c4b5fd)"
                : "linear-gradient(90deg, #38bdf8, #22c55e)",
            }}
          />
        </div>
      </div>

      <div
        className="relative flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--glass-border)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Best:{" "}
          <strong style={{ color: meta.badgeColor }}>{best} days</strong>
        </span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{
            background: meta.badgeBg,
            color: meta.badgeColor,
            border: `1px solid ${meta.badgeColor}`,
          }}
        >
          {meta.label}
        </span>
      </div>

      <p
        className="relative text-[11px] font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {meta.message}
      </p>
    </GlassCard>
  );
}
