"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatPercent } from "@/lib/format";

interface ValuationResponse {
  currentPrice: number | null;
  fairValueConsensus: number | null;
}

export function PriceVsFairValueCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<ValuationResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  if (!loaded) {
    return (
      <Card>
        <CardHeader title="Precio de la acción vs. valor razonable" />
        <Spinner />
      </Card>
    );
  }

  const currentPrice = data?.currentPrice ?? null;
  const fairValue = data?.fairValueConsensus ?? null;

  if (currentPrice === null || fairValue === null || fairValue <= 0) {
    return (
      <Card>
        <CardHeader title="Precio de la acción vs. valor razonable" />
        <p className="text-sm text-app-fg-muted">
          Dato no disponible: no hay suficientes modelos de valoración con datos reales para esta acción.
        </p>
      </Card>
    );
  }

  const deviationPct = (currentPrice - fairValue) / fairValue;
  const overvalued = deviationPct > 0.1;
  const undervalued = deviationPct < -0.1;
  const label = overvalued ? "Sobrevalorada" : undervalued ? "Infravalorada" : "Precio justo";
  const badgeColor = overvalued ? "text-negative" : undervalued ? "text-positive" : "text-warning";
  const barColor = overvalued ? "bg-negative" : "bg-positive";

  const scaleMax = Math.max(currentPrice, fairValue) * 1.08;
  const fairValuePct = (fairValue / scaleMax) * 100;
  const currentPricePct = (currentPrice / scaleMax) * 100;

  return (
    <Card>
      <CardHeader
        title="Precio de la acción vs. valor razonable"
        subtitle="¿Cuál es el precio justo si consideramos sus flujos de caja futuros? Estimación vía modelo de flujo de caja descontado (DCF) y modelos comparables."
      />

      <div className="mb-4">
        <p className={`text-2xl font-bold tabular-nums ${badgeColor}`}>{formatPercent(Math.abs(deviationPct))}</p>
        <p className={`text-sm font-medium ${badgeColor}`}>{label}</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <div className="h-8 w-full rounded-sm bg-app-surface-2">
            <div
              className={`h-full rounded-sm ${barColor}`}
              style={{ width: `${Math.min(100, currentPricePct)}%` }}
            />
          </div>
          <div
            className="absolute top-0 h-8 w-px bg-warning"
            style={{ left: `${Math.min(100, fairValuePct)}%` }}
          />
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-app-fg-muted">Precio actual</span>
            <span className="font-semibold text-app-fg">{formatCurrency(currentPrice)}</span>
          </div>
        </div>

        <div className="relative">
          <div className="h-8 w-full rounded-sm bg-app-surface-2">
            <div
              className="h-full rounded-sm bg-positive"
              style={{ width: `${Math.min(100, fairValuePct)}%` }}
            />
          </div>
          <div
            className="absolute top-0 h-8 w-px bg-warning"
            style={{ left: `${Math.min(100, fairValuePct)}%` }}
          />
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-app-fg-muted">Valor razonable</span>
            <span className="font-semibold text-app-fg">{formatCurrency(fairValue)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
