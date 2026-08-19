"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { computeCagrFromHistory } from "@/lib/growth";

interface HistoryPoint {
  fiscalDate: string;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  fcf: number | null;
}

interface FundamentalsResponse {
  fundamentals: { revenue: number | null; netIncome: number | null; eps: number | null; fcf: number | null };
  history: HistoryPoint[];
}

const METRICS = [
  { key: "revenue" as const, label: "Ingresos", format: formatCompact },
  { key: "netIncome" as const, label: "Utilidad neta", format: formatCompact },
  { key: "eps" as const, label: "EPS", format: (v: number | null) => formatCurrency(v) },
  { key: "fcf" as const, label: "FCF", format: formatCompact },
];

export function FundamentalsMiniCards({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalsResponse | null>(null);

  useEffect(() => {
    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {METRICS.map((metric) => {
        const current = data?.fundamentals[metric.key] ?? null;
        const history = (data?.history ?? []).map((h) => ({
          fiscalDate: h.fiscalDate,
          value: h[metric.key],
        }));
        const { cagr, yearsSpan, sampleCount } = computeCagrFromHistory(history);

        return (
          <Card key={metric.key}>
            <p className="text-xs text-app-fg-muted">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold text-app-fg">{metric.format(current)}</p>
            <p className="mt-1 text-xs text-app-fg-muted">
              {cagr !== null
                ? `CAGR ${yearsSpan.toFixed(1)} años: ${formatPercent(cagr)}`
                : sampleCount < 2
                  ? "Historial insuficiente para CAGR"
                  : "Dato no disponible"}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
