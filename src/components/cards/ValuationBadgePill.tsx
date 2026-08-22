import type { ValuationBadge } from "@/lib/valuation/consensus";

// Los 5 niveles de valoración se mapean sobre los 3 tokens semánticos ya
// existentes (positive/warning/negative, igual que Badge.tsx) — la opacidad
// de fondo distingue la intensidad dentro de cada tono en vez de inventar
// un cuarto color (ej. "naranja") fuera del sistema.
const BADGE_CONFIG: Record<ValuationBadge, { label: string; className: string }> = {
  great_discount: { label: "🟢 Gran descuento", className: "bg-positive/20 text-positive" },
  discount: { label: "🟢 Descuento", className: "bg-positive/10 text-positive" },
  fair_price: { label: "🟡 Precio razonable", className: "bg-warning/15 text-warning" },
  overvalued: { label: "🟠 Sobrevalorada", className: "bg-negative/10 text-negative" },
  very_overvalued: { label: "🔴 Muy sobrevalorada", className: "bg-negative/20 text-negative" },
};

export function ValuationBadgePill({ badge }: { badge: ValuationBadge | null }) {
  if (!badge) {
    return <span className="text-xs text-app-fg-muted">Dato no disponible</span>;
  }
  const config = BADGE_CONFIG[badge];
  return (
    <span className={`rounded-pill px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
