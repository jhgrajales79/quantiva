import type { ValuationBadge } from "@/lib/valuation/consensus";

const BADGE_CONFIG: Record<ValuationBadge, { label: string; className: string }> = {
  great_discount: { label: "🟢 Gran descuento", className: "bg-emerald-500/15 text-emerald-400" },
  discount: { label: "🟢 Descuento", className: "bg-emerald-500/10 text-emerald-500" },
  fair_price: { label: "🟡 Precio razonable", className: "bg-amber-500/15 text-amber-400" },
  overvalued: { label: "🟠 Sobrevalorada", className: "bg-orange-500/15 text-orange-400" },
  very_overvalued: { label: "🔴 Muy sobrevalorada", className: "bg-red-500/15 text-red-400" },
};

export function ValuationBadgePill({ badge }: { badge: ValuationBadge | null }) {
  if (!badge) {
    return <span className="text-xs text-app-fg-muted">Dato no disponible</span>;
  }
  const config = BADGE_CONFIG[badge];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
