import type { PricePoint } from "@/lib/providers/types";

export type ReturnPeriod = "1d" | "1w" | "1m" | "ytd";

const TRADING_DAYS: Record<Exclude<ReturnPeriod, "ytd">, number> = {
  "1d": 1,
  "1w": 5,
  "1m": 21,
};

/**
 * Calcula el retorno porcentual entre el cierre más reciente y el cierre de
 * hace N días de trading (o el primer cierre del año para YTD). `history`
 * debe venir ordenado ascendente por fecha (igual que `getDailyPriceHistory`).
 * Retorna null explícito si no hay suficiente historial — nunca se
 * aproxima con menos datos de los necesarios.
 */
export function computeReturn(history: PricePoint[], period: ReturnPeriod): number | null {
  if (history.length === 0) return null;
  const latest = history[history.length - 1];

  if (period === "ytd") {
    const currentYear = latest.date.slice(0, 4);
    const firstOfYear = history.find((p) => p.date.slice(0, 4) === currentYear);
    if (!firstOfYear || firstOfYear.close === 0) return null;
    return (latest.close - firstOfYear.close) / firstOfYear.close;
  }

  const daysAgo = TRADING_DAYS[period];
  const index = history.length - 1 - daysAgo;
  if (index < 0) return null;

  const base = history[index];
  if (base.close === 0) return null;
  return (latest.close - base.close) / base.close;
}
