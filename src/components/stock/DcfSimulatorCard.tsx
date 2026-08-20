"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatPercent } from "@/lib/format";

interface SimulatorResponse {
  currentPrice: number | null;
  fairValue: number | null;
  upsidePct: number | null;
  unavailableReason: string | null;
  assumptionsUsed?: { growthRateUsed?: number };
}

export function DcfSimulatorCard({ symbol }: { symbol: string }) {
  const [growth, setGrowth] = useState<number | null>(null);
  const [erp, setErp] = useState(4.5);
  const [years, setYears] = useState(5);
  const [result, setResult] = useState<SimulatorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGrowth(null);
    setResult(null);
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ equityRiskPremium: String(erp), years: String(years) });
    if (growth !== null) params.set("growth", String(growth));
    fetch(`/api/dcf-simulator/${symbol}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SimulatorResponse | null) => {
        setResult(data);
        if (growth === null && data?.assumptionsUsed?.growthRateUsed != null) {
          setGrowth(Math.round(data.assumptionsUsed.growthRateUsed * 100));
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [symbol, growth, erp, years]);

  return (
    <Card>
      <CardHeader
        title="Simulador de valor justo (DCF)"
        subtitle="Ajusta los supuestos del modelo DCF real de Quantiva y ve el resultado en vivo"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs text-app-fg-muted">
          Crecimiento del FCF proyectado:{" "}
          <span className="font-medium text-app-fg">{growth ?? "—"}%/año</span>
          <input
            type="range"
            min={-10}
            max={120}
            step={1}
            value={growth ?? 0}
            disabled={growth === null}
            onChange={(e) => setGrowth(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-xs text-app-fg-muted">
          Prima de riesgo de mercado: <span className="font-medium text-app-fg">{erp}%</span>
          <input
            type="range"
            min={2}
            max={8}
            step={0.1}
            value={erp}
            onChange={(e) => setErp(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-xs text-app-fg-muted">
          Años de proyección: <span className="font-medium text-app-fg">{years}</span>
          <input
            type="range"
            min={3}
            max={10}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>

      <div className="mt-4 rounded-md bg-app-surface-2 p-3">
        {loading ? (
          <Spinner />
        ) : !result || result.unavailableReason ? (
          <p className="text-sm text-app-fg-muted">
            {result?.unavailableReason ?? "Dato no disponible"}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-app-fg-muted">Valor justo simulado</p>
              <p className="text-2xl font-semibold text-app-fg">{formatCurrency(result.fairValue)}</p>
            </div>
            <div>
              <p className="text-xs text-app-fg-muted">Precio actual</p>
              <p className="text-lg text-app-fg">{formatCurrency(result.currentPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-app-fg-muted">Upside implícito</p>
              <p className={`text-lg font-medium tabular-nums ${result.upsidePct !== null && result.upsidePct >= 0 ? "text-positive" : "text-negative"}`}>
                {result.upsidePct !== null
                  ? `${result.upsidePct >= 0 ? "+" : ""}${formatPercent(result.upsidePct)}`
                  : "—"}
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-app-fg-faint">
        Recalcula el mismo modelo DCF que usa el Investment Score, con tus propios supuestos en vez de los
        valores por defecto. No es una recomendación de inversión.
      </p>
    </Card>
  );
}
