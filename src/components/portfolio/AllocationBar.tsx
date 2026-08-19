import { formatPercent } from "@/lib/format";

const SEGMENT_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
];
const OTHERS_COLOR = "bg-app-fg-faint";
const MAX_SEGMENTS = 5;

export function AllocationBar({
  allocation,
}: {
  allocation: { symbol: string; weightPct: number | null }[];
}) {
  if (allocation.length === 0) {
    return <p className="text-xs text-app-fg-faint">Sin posiciones con valor de mercado todavía.</p>;
  }

  const top = allocation.slice(0, MAX_SEGMENTS);
  const rest = allocation.slice(MAX_SEGMENTS);
  const othersPct = rest.reduce((sum, h) => sum + (h.weightPct ?? 0), 0);

  const segments = [
    ...top.map((h, i) => ({ label: h.symbol, pct: h.weightPct ?? 0, color: SEGMENT_COLORS[i] })),
    ...(rest.length > 0 ? [{ label: "Otros", pct: othersPct, color: OTHERS_COLOR }] : []),
  ];

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-app-surface-2">
        {segments.map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${Math.max(0, Math.min(100, s.pct * 100))}%` }}
            title={`${s.label}: ${formatPercent(s.pct)}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1 text-xs text-app-fg-muted">
            <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
            {s.label} {formatPercent(s.pct)}
          </span>
        ))}
      </div>
    </div>
  );
}
