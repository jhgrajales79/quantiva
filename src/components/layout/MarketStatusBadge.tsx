"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useMarketStatus, formatCountdown } from "@/lib/useMarketStatus";

const LABELS: Record<string, { label: string; variant: BadgeVariant; transitionVerb: string; dot: string }> = {
  "pre-market": { label: "Pre-market", variant: "warning", transitionVerb: "abre en", dot: "bg-amber-400" },
  open: { label: "Mercado abierto", variant: "success", transitionVerb: "cierra en", dot: "bg-emerald-400" },
  "after-hours": { label: "After-hours", variant: "warning", transitionVerb: "cierra en", dot: "bg-amber-400" },
  closed: { label: "Mercado cerrado", variant: "neutral", transitionVerb: "", dot: "bg-app-fg-faint" },
};

export function MarketStatusBadge() {
  const { status, minutesToNextTransition } = useMarketStatus();
  if (!status) return null;

  const { label, variant, transitionVerb, dot } = LABELS[status];
  const suffix =
    minutesToNextTransition !== null
      ? ` · ${transitionVerb} ${formatCountdown(minutesToNextTransition)}`
      : "";

  return (
    <Badge variant={variant} className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${status === "open" ? "animate-pulse" : ""}`} />
      {label}
      {suffix}
    </Badge>
  );
}
