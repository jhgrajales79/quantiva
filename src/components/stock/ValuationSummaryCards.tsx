"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
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

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setValuation)
      .catch(() => setValuation(null));
    fetch(`/api/stock-overview/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setOverview)
      .catch(() => setOverview(null));
    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setRatios)
      .catch(() => setRatios(null));
    fetch(`/api/earnings-calendar/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setEarnings)
      .catch(() => setEarnings(null));
  }, [symbol]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <p className="text-xs text-app-fg-muted">Investment Score</p>
        <p className="mt-1 text-2xl font-semibold text-app-fg">
          {valuation?.scores.investment !== null && valuation?.scores.investment !== undefined
            ? valuation.scores.investment.toFixed(0)
            : "—"}
        </p>
        <p className="text-xs text-app-fg-muted">
          Upside vs. Fair Value: {formatPercent(valuation?.upsidePct ?? null)}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-app-fg-muted">Estimados</p>
        <p className="mt-1 text-2xl font-semibold text-app-fg">
          {overview?.forwardPe !== null && overview?.forwardPe !== undefined
            ? `${overview.forwardPe.toFixed(1)}x`
            : "—"}
        </p>
        <p className="text-xs text-app-fg-muted">
          adelante · {ratios?.ratios?.pe !== null && ratios?.ratios?.pe !== undefined ? `${ratios.ratios.pe.toFixed(1)}x actual` : "actual no disponible"}
        </p>
      </Card>
      <Card>
        <p className="text-xs text-app-fg-muted">Crecimiento</p>
        <p className="mt-1 text-2xl font-semibold text-app-fg">
          {formatPercent(ratios?.ratios?.revenueGrowth ?? null)}
        </p>
        <p className="text-xs text-app-fg-muted">ingresos · anual</p>
      </Card>
      <Card>
        <p className="text-xs text-app-fg-muted">Próximo evento</p>
        {earnings ? (
          <>
            <p className="mt-1 text-lg font-semibold text-app-fg">Ganancias</p>
            <p className="text-xs text-app-fg-muted">
              {earnings.reportDate} · en {earnings.daysUntil} días
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-app-fg-muted">Dato no disponible</p>
        )}
      </Card>
    </div>
  );
}
