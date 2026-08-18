import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesDaily } from "@/lib/db/schema";

export interface PerformanceMetrics {
  perf1m: number | null;
  perf3m: number | null;
  perf6m: number | null;
  perf12m: number | null;
  priceVsMa50Pct: number | null;
  priceVsMa200Pct: number | null;
}

const EMPTY: PerformanceMetrics = {
  perf1m: null,
  perf3m: null,
  perf6m: null,
  perf12m: null,
  priceVsMa50Pct: null,
  priceVsMa200Pct: null,
};

/**
 * Calcula momentum a partir del histórico diario propio (tabla prices_daily).
 * Si no hay suficiente historial todavía (instalación nueva, cron aún no
 * corrió lo suficiente), retorna null explícito en cada campo — nunca se
 * inventa una tendencia.
 */
export async function computePerformance(assetId: string): Promise<PerformanceMetrics> {
  const rows = await db
    .select({ date: pricesDaily.date, close: pricesDaily.close })
    .from(pricesDaily)
    .where(eq(pricesDaily.assetId, assetId))
    .orderBy(desc(pricesDaily.date))
    .limit(260);

  if (rows.length === 0) return EMPTY;

  const latestClose = rows[0].close;

  function perfOver(tradingDaysAgo: number): number | null {
    const point = rows[tradingDaysAgo];
    if (!point) return null;
    return (latestClose - point.close) / point.close;
  }

  function movingAverage(days: number): number | null {
    if (rows.length < days) return null;
    const slice = rows.slice(0, days);
    const sum = slice.reduce((acc, r) => acc + r.close, 0);
    return sum / days;
  }

  const ma50 = movingAverage(50);
  const ma200 = movingAverage(200);

  return {
    perf1m: perfOver(21),
    perf3m: perfOver(63),
    perf6m: perfOver(126),
    perf12m: perfOver(252),
    priceVsMa50Pct: ma50 ? (latestClose - ma50) / ma50 : null,
    priceVsMa200Pct: ma200 ? (latestClose - ma200) / ma200 : null,
  };
}
