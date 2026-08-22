"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { Skeleton } from "@/components/ui/Skeleton";
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

function fiscalYear(fiscalDate: string): string {
  return fiscalDate.slice(0, 4);
}

function TrendBars({ points }: { points: { fiscalDate: string; value: number | null }[] }) {
  const withValue = points.filter((p) => p.value !== null);
  if (withValue.length < 2) {
    return <p className="mt-2 text-xs text-app-fg-faint">Historial insuficiente para tendencia</p>;
  }

  const maxAbs = Math.max(1, ...withValue.map((p) => Math.abs(p.value as number)));

  return (
    <div className="mt-3 flex h-12 items-end gap-1">
      {withValue.map((p) => {
        const value = p.value as number;
        const isNegative = value < 0;
        return (
          <Tooltip key={p.fiscalDate} content={fiscalYear(p.fiscalDate)}>
            <div className="flex-1">
              <div
                className={`w-full rounded-sm ${isNegative ? "bg-negative/70" : "bg-positive/70"}`}
                style={{ height: `${Math.max(6, (Math.abs(value) / maxAbs) * 48)}px` }}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function FundamentalsMiniCards({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalsResponse | null>(null);

  useEffect(() => {
    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric) => (
          <Card key={metric.key}>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-2 h-6 w-1/2" />
            <Skeleton className="mt-2 h-3 w-3/4" />
            <Skeleton className="mt-3 h-12 w-full" />
          </Card>
        ))}
      </div>
    );
  }

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
            <TrendBars points={history} />
          </Card>
        );
      })}
    </div>
  );
}
