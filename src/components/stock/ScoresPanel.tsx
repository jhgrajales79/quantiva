"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ScoreGauge, type ScoreBreakdownItem, type ScoreTrend } from "@/components/cards/ScoreGauge";
import { formatPercent } from "@/lib/format";

interface ScoresResponse {
  scores: {
    value: number | null;
    quality: number | null;
    growth: number | null;
    momentum: number | null;
    investment: number | null;
  };
  scoreInputs: {
    value: { upsidePct: number | null; fcfYield: number | null; dividendYield: number | null };
    quality: {
      roe: number | null;
      roic: number | null;
      grossMargin: number | null;
      operatingMargin: number | null;
      debtToEbitda: number | null;
    };
    growth: { revenueGrowth: number | null; epsGrowth: number | null };
    momentum: {
      perf1m: number | null;
      perf3m: number | null;
      perf6m: number | null;
      perf12m: number | null;
      priceVsMa50Pct: number | null;
      priceVsMa200Pct: number | null;
    };
    investment: { value: number | null; quality: number | null; growth: number | null; momentum: number | null };
  };
  scoreHistory: {
    calculatedAt: string;
    value: number | null;
    quality: number | null;
    growth: number | null;
    momentum: number | null;
    investment: number | null;
  }[];
}

const NA = "Dato no disponible";
const pct = (v: number | null) => (v === null ? NA : formatPercent(v));
const ratio = (v: number | null) => (v === null ? NA : `${v.toFixed(2)}×`);
const pts = (v: number | null) => (v === null ? NA : v.toFixed(0));

function trendFor(
  history: ScoresResponse["scoreHistory"],
  key: "value" | "quality" | "growth" | "momentum" | "investment",
): ScoreTrend | null {
  const withValue = history.filter((h) => h[key] !== null);
  if (withValue.length < 2) return null;

  const oldest = withValue[0];
  const newest = withValue[withValue.length - 1];
  const deltaPts = (newest[key] as number) - (oldest[key] as number);
  const days = Math.round(
    (new Date(newest.calculatedAt).getTime() - new Date(oldest.calculatedAt).getTime()) / (24 * 60 * 60_000),
  );
  const sinceLabel = days <= 0 ? "desde el último cálculo" : `en ${days}d`;
  return { deltaPts, sinceLabel };
}

export function ScoresPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<ScoresResponse | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  const inputs = data?.scoreInputs;
  const history = data?.scoreHistory ?? [];

  const valueBreakdown: ScoreBreakdownItem[] | undefined = inputs && [
    { label: "Upside vs. Fair Value", weightPct: 60, formattedValue: pct(inputs.value.upsidePct) },
    { label: "FCF Yield", weightPct: 30, formattedValue: pct(inputs.value.fcfYield) },
    { label: "Dividend Yield", weightPct: 10, formattedValue: pct(inputs.value.dividendYield) },
  ];

  const qualityBreakdown: ScoreBreakdownItem[] | undefined = inputs && [
    { label: "ROE", weightPct: 25, formattedValue: pct(inputs.quality.roe) },
    { label: "ROIC", weightPct: 25, formattedValue: pct(inputs.quality.roic) },
    { label: "Margen bruto", weightPct: 20, formattedValue: pct(inputs.quality.grossMargin) },
    { label: "Margen operativo", weightPct: 15, formattedValue: pct(inputs.quality.operatingMargin) },
    { label: "Deuda/EBITDA (invertido)", weightPct: 15, formattedValue: ratio(inputs.quality.debtToEbitda) },
  ];

  const growthBreakdown: ScoreBreakdownItem[] | undefined = inputs && [
    { label: "Crecimiento de ingresos", weightPct: 50, formattedValue: pct(inputs.growth.revenueGrowth) },
    { label: "Crecimiento de EPS", weightPct: 50, formattedValue: pct(inputs.growth.epsGrowth) },
  ];

  const momentumBreakdown: ScoreBreakdownItem[] | undefined = inputs && [
    { label: "Rendimiento 1 mes", weightPct: 15, formattedValue: pct(inputs.momentum.perf1m) },
    { label: "Rendimiento 3 meses", weightPct: 20, formattedValue: pct(inputs.momentum.perf3m) },
    { label: "Rendimiento 6 meses", weightPct: 20, formattedValue: pct(inputs.momentum.perf6m) },
    { label: "Rendimiento 12 meses", weightPct: 20, formattedValue: pct(inputs.momentum.perf12m) },
    { label: "Precio vs. media móvil 50d", weightPct: 12.5, formattedValue: pct(inputs.momentum.priceVsMa50Pct) },
    { label: "Precio vs. media móvil 200d", weightPct: 12.5, formattedValue: pct(inputs.momentum.priceVsMa200Pct) },
  ];

  const investmentBreakdown: ScoreBreakdownItem[] | undefined = inputs && [
    { label: "Valor", weightPct: 30, formattedValue: pts(inputs.investment.value) },
    { label: "Calidad", weightPct: 25, formattedValue: pts(inputs.investment.quality) },
    { label: "Crecimiento", weightPct: 20, formattedValue: pts(inputs.investment.growth) },
    { label: "Momentum", weightPct: 15, formattedValue: pts(inputs.investment.momentum) },
  ];

  return (
    <Card>
      <CardHeader
        title="Puntajes de inversión"
        subtitle="0–100, calculados con el Fair Value Engine propio de Quantiva sobre datos reales de Yahoo Finance."
      />
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
        <ScoreGauge
          label="Investment Score"
          value={data?.scores.investment ?? null}
          size="lg"
          breakdown={investmentBreakdown}
          trend={trendFor(history, "investment")}
        />
        <div className="flex flex-wrap justify-center gap-4">
          <ScoreGauge
            label="Valor"
            value={data?.scores.value ?? null}
            breakdown={valueBreakdown}
            trend={trendFor(history, "value")}
          />
          <ScoreGauge
            label="Calidad"
            value={data?.scores.quality ?? null}
            breakdown={qualityBreakdown}
            trend={trendFor(history, "quality")}
          />
          <ScoreGauge
            label="Crecimiento"
            value={data?.scores.growth ?? null}
            breakdown={growthBreakdown}
            trend={trendFor(history, "growth")}
          />
          <ScoreGauge
            label="Momentum"
            value={data?.scores.momentum ?? null}
            breakdown={momentumBreakdown}
            trend={trendFor(history, "momentum")}
          />
        </div>
      </div>
    </Card>
  );
}
