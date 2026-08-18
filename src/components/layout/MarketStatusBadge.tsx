"use client";

import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { useMarketStatus, formatCountdown } from "@/lib/useMarketStatus";

const LABELS: Record<string, { label: string; variant: BadgeVariant; transitionVerb: string }> = {
  "pre-market": { label: "Pre-market", variant: "warning", transitionVerb: "abre en" },
  open: { label: "Mercado abierto", variant: "success", transitionVerb: "cierra en" },
  "after-hours": { label: "After-hours", variant: "warning", transitionVerb: "cierra en" },
  closed: { label: "Mercado cerrado", variant: "neutral", transitionVerb: "" },
};

export function MarketStatusBadge() {
  const { status, minutesToNextTransition } = useMarketStatus();
  if (!status) return null;

  const { label, variant, transitionVerb } = LABELS[status];
  const suffix =
    minutesToNextTransition !== null
      ? ` · ${transitionVerb} ${formatCountdown(minutesToNextTransition)}`
      : "";

  return (
    <Badge variant={variant}>
      {label}
      {suffix}
    </Badge>
  );
}
