"use client";

import { useEffect, useState } from "react";

type MarketStatus = "pre-market" | "open" | "after-hours" | "closed";

const LABELS: Record<MarketStatus, { label: string; className: string }> = {
  "pre-market": { label: "Pre-market", className: "bg-amber-500/15 text-amber-400" },
  open: { label: "Mercado abierto", className: "bg-emerald-500/15 text-emerald-400" },
  "after-hours": { label: "After-hours", className: "bg-amber-500/15 text-amber-400" },
  closed: { label: "Mercado cerrado", className: "bg-neutral-700/40 text-neutral-400" },
};

export function MarketStatusBadge() {
  const [status, setStatus] = useState<MarketStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/market-status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setStatus(data.status);
      })
      .catch(() => {
        if (mounted) setStatus(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!status) return null;
  const { label, className } = LABELS[status];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
