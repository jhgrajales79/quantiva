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

interface ScoreGaugeProps {
  label: string;
  value: number | null;
  size?: "sm" | "lg";
  sublabel?: string;
}

export function ScoreGauge({ label, value, size = "sm", sublabel }: ScoreGaugeProps) {
  const cx = 100;
  const cy = 100;
  const r = size === "lg" ? 80 : 70;
  const strokeWidth = size === "lg" ? 18 : 16;
  const clamped = value === null ? null : Math.max(0, Math.min(100, value));
  const zone = clamped !== null ? zoneFor(clamped) : null;
  const needleAngle = 180 - ((clamped ?? 0) / 100) * 180;
  const needleTip = polarToCartesian(cx, cy, r - strokeWidth / 2 - 4, needleAngle);
  const height = size === "lg" ? 130 : 118;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 200 ${height}`} className={size === "lg" ? "w-56" : "w-40"}>
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
        className="-mt-6 rounded-full px-3 py-1 text-lg font-bold text-white"
        style={{ backgroundColor: zone?.color ?? "var(--color-app-surface-2)" }}
      >
        {clamped !== null ? clamped.toFixed(0) : "—"}
      </div>
      <p className="mt-1 text-sm font-medium text-app-fg">{label}</p>
      {sublabel && <p className="text-xs text-app-fg-muted">{sublabel}</p>}
      {clamped === null && <p className="text-xs text-app-fg-faint">Dato no disponible</p>}
    </div>
  );
}
