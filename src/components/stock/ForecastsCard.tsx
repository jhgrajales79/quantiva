"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

interface ForecastPeriod {
  period: string;
  label: string;
  endDate: string | null;
  epsEstimateAvg: number | null;
  epsGrowth: number | null;
  revenueEstimateAvg: number | null;
  revenueGrowth: number | null;
  numberOfAnalysts: number | null;
}

export function ForecastsCard({ symbol }: { symbol: string }) {
  const [forecasts, setForecasts] = useState<ForecastPeriod[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/forecasts/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setForecasts(data?.forecasts ?? null))
      .catch(() => setForecasts(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Previsiones" subtitle="Estimados de consenso de analistas, vía Yahoo Finance" />
      {!loaded ? (
        <Spinner />
      ) : !forecasts || forecasts.length === 0 ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {forecasts.map((f) => (
            <div key={f.period} className="rounded-md border border-app-border p-3">
              <p className="text-xs font-medium text-app-fg-muted">
                {f.label} {f.endDate ? `(${f.endDate})` : ""}
              </p>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-app-fg-muted">BPA estimado</span>
                <span className="font-medium text-app-fg">
                  {formatCurrency(f.epsEstimateAvg)}
                  {f.epsGrowth !== null && (
                    <span className={f.epsGrowth >= 0 ? "ml-1 text-emerald-400" : "ml-1 text-red-400"}>
                      ({f.epsGrowth >= 0 ? "+" : ""}
                      {formatPercent(f.epsGrowth)})
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-0.5 flex justify-between text-sm">
                <span className="text-app-fg-muted">Ingresos estimados</span>
                <span className="font-medium text-app-fg">
                  {formatCompact(f.revenueEstimateAvg)}
                  {f.revenueGrowth !== null && (
                    <span className={f.revenueGrowth >= 0 ? "ml-1 text-emerald-400" : "ml-1 text-red-400"}>
                      ({f.revenueGrowth >= 0 ? "+" : ""}
                      {formatPercent(f.revenueGrowth)})
                    </span>
                  )}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-app-fg-faint">
                {f.numberOfAnalysts !== null ? `${f.numberOfAnalysts} analistas` : "Dato no disponible"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
