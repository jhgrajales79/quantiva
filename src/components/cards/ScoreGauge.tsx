"use client";

import { useState } from "react";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";

const ZONES = [
  { max: 20, label: "Débil", color: "#f87171" },
  { max: 40, label: "Bajo", color: "#fb923c" },
  { max: 60, label: "Neutral", color: "#fbbf24" },
  { max: 80, label: "Sólido", color: "#a3e635" },
  { max: 100, label: "Excelente", color: "#34d399" },
];

function zoneFor(value: number) {
  return ZONES.find((z) => value <= z.max) ?? ZONES[ZONES.length - 1];
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = Math.abs(startAngle - endAngle) <= 180 ? 0 : 1;
  const sweepFlag = startAngle > endAngle ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

export interface ScoreBreakdownItem {
  label: string;
  weightPct: number;
  formattedValue: string;
}

export interface ScoreTrend {
  deltaPts: number;
  sinceLabel: string;
}

interface ScoreGaugeProps {
  label: string;
  value: number | null;
  size?: "sm" | "lg";
  sublabel?: string;
  breakdown?: ScoreBreakdownItem[];
  trend?: ScoreTrend | null;
}

export function ScoreGauge({ label, value, size = "sm", sublabel, breakdown, trend }: ScoreGaugeProps) {
  const [expanded, setExpanded] = useState(false);

  const cx = 100;
  const cy = 100;
  const r = size === "lg" ? 82 : 74;
  const strokeWidth = size === "lg" ? 20 : 18;
  const clamped = value === null ? null : Math.max(0, Math.min(100, value));
  const zone = clamped !== null ? zoneFor(clamped) : null;
  const needleAngle = 180 - ((clamped ?? 0) / 100) * 180;
  const needleTip = polarToCartesian(cx, cy, r - strokeWidth / 2 - 4, needleAngle);
  const height = size === "lg" ? 136 : 124;

  return (
    <div className={`flex flex-col items-center ${size === "lg" ? "w-64" : "w-48"}`}>
      <svg viewBox={`0 0 200 ${height}`} className={size === "lg" ? "w-64" : "w-48"}>
        {ZONES.map((z, i) => {
          const prevMax = i === 0 ? 0 : ZONES[i - 1].max;
          const startAngle = 180 - (prevMax / 100) * 180;
          const endAngle = 180 - (z.max / 100) * 180;
          const isCurrentZone = zone === z;
          return (
            <path
              key={z.label}
              d={describeArc(cx, cy, r, startAngle, endAngle)}
              fill="none"
              stroke={isCurrentZone ? z.color : "var(--color-app-surface-2)"}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity={isCurrentZone ? 1 : 0.7}
            />
          );
        })}
        {clamped !== null && (
          <>
            <line
              x1={cx}
              y1={cy}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="var(--color-app-fg)"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={5} fill="var(--color-app-fg)" />
          </>
        )}
      </svg>

      <div
        className={`-mt-7 rounded-full font-bold text-white ${size === "lg" ? "px-4 py-1.5 text-2xl" : "px-3 py-1 text-lg"}`}
        style={{ backgroundColor: zone?.color ?? "var(--color-app-surface-2)" }}
      >
        {clamped !== null ? clamped.toFixed(0) : "—"}
      </div>

      {zone && (
        <p className="mt-1 text-xs font-semibold" style={{ color: zone.color }}>
          {zone.label}
        </p>
      )}

      <p className="mt-0.5 text-sm font-medium text-app-fg">{label}</p>
      {sublabel && <p className="text-xs text-app-fg-muted">{sublabel}</p>}
      {clamped === null && <p className="text-xs text-app-fg-faint">Dato no disponible</p>}

      {clamped !== null && (
        <p className="mt-1 text-xs text-app-fg-faint">
          {trend ? (
            <span className={`flex items-center gap-1 ${trend.deltaPts >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend.deltaPts >= 0 ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
              {trend.deltaPts >= 0 ? "+" : ""}
              {trend.deltaPts.toFixed(0)} pts {trend.sinceLabel}
            </span>
          ) : (
            "Historial insuficiente para tendencia"
          )}
        </p>
      )}

      {breakdown && breakdown.length > 0 && (
        <div className="mt-2 w-full">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1 text-xs text-app-fg-muted hover:text-app-fg"
          >
            Ver desglose
            <ChevronDown size={13} strokeWidth={2} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 rounded-md border border-app-border bg-app-surface-2 p-2 text-left">
              {breakdown.map((item) => (
                <li key={item.label} className="flex justify-between gap-2 text-xs">
                  <span className="text-app-fg-muted">
                    {item.label} <span className="text-app-fg-faint">({item.weightPct}%)</span>
                  </span>
                  <span className="font-medium text-app-fg">{item.formattedValue}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
