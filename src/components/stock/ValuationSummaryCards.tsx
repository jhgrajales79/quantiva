"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPercent } from "@/lib/format";

interface ValuationSummary {
  scores: { investment: number | null };
  upsidePct: number | null;
}

interface OverviewSummary {
  forwardPe: number | null;
}

interface RatiosSummary {
  ratios: { pe: number | null; revenueGrowth: number | null } | null;
}

interface EarningsSummary {
  reportDate: string;
  daysUntil: number;
}

export function ValuationSummaryCards({ symbol }: { symbol: string }) {
  const [valuation, setValuation] = useState<ValuationSummary | null>(null);
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [ratios, setRatios] = useState<RatiosSummary | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      fetch(`/api/valuation/${symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setValuation)
        .catch(() => setValuation(null)),
      fetch(`/api/stock-overview/${symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setOverview)
        .catch(() => setOverview(null)),
      fetch(`/api/fundamentals/${symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setRatios)
        .catch(() => setRatios(null)),
      fetch(`/api/earnings-calendar/${symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then(setEarnings)
        .catch(() => setEarnings(null)),
    ]).finally(() => setLoaded(true));
  }, [symbol]);

  if (!loaded) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-2 h-7 w-1/2" />
            <Skeleton className="mt-2 h-3 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Investment Score"
        value={
          valuation?.scores.investment !== null && valuation?.scores.investment !== undefined
            ? valuation.scores.investment.toFixed(0)
            : "—"
        }
        deltaLabel={`Upside vs. Fair Value: ${formatPercent(valuation?.upsidePct ?? null)}`}
      />
      <StatCard
        label="Estimados"
        value={
          overview?.forwardPe !== null && overview?.forwardPe !== undefined
            ? `${overview.forwardPe.toFixed(1)}x`
            : "—"
        }
        deltaLabel={`adelante · ${
          ratios?.ratios?.pe !== null && ratios?.ratios?.pe !== undefined
            ? `${ratios.ratios.pe.toFixed(1)}x actual`
            : "actual no disponible"
        }`}
      />
      <StatCard
        label="Crecimiento"
        value={formatPercent(ratios?.ratios?.revenueGrowth ?? null)}
        deltaLabel="ingresos · anual"
      />
      <StatCard
        label="Próximo evento"
        value={earnings ? "Ganancias" : "—"}
        deltaLabel={earnings ? `${earnings.reportDate} · en ${earnings.daysUntil} días` : "Dato no disponible"}
      />
    </div>
  );
}
