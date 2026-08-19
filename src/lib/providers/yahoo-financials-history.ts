import { z } from "zod";
import { yahooFetchPublic } from "./yahoo-http";

const timeseriesResponseSchema = z.object({
  timeseries: z.object({
    result: z.array(z.record(z.string(), z.unknown())).nullable(),
  }),
});

export interface AnnualFinancialsPoint {
  fiscalDate: string;
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  fcf: number | null;
}

const TYPES = ["annualTotalRevenue", "annualNetIncome", "annualDilutedEPS", "annualFreeCashFlow"];

/**
 * Serie histórica anual real (típicamente los últimos 4 años) vía el
 * endpoint público fundamentals-timeseries de Yahoo Finance (sin auth). A
 * diferencia de financialData/defaultKeyStatistics (usados en
 * getFundamentals), este endpoint sí expone múltiples años por separado en
 * vez de solo el TTM actual.
 */
export async function getAnnualFinancialsHistory(symbol: string): Promise<AnnualFinancialsPoint[]> {
  const period1 = 0; // desde 1970, Yahoo recorta a lo que tenga disponible
  const period2 = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const url =
    `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${symbol}` +
    `?type=${TYPES.join(",")}&period1=${period1}&period2=${period2}&merge=false`;

  const data = await yahooFetchPublic(url, timeseriesResponseSchema);
  const results = data.timeseries.result ?? [];

  const byDate = new Map<string, AnnualFinancialsPoint>();

  for (const result of results) {
    const meta = result.meta as { type?: unknown[] } | undefined;
    const type = typeof meta?.type?.[0] === "string" ? (meta.type[0] as string) : null;
    if (!type || !TYPES.includes(type)) continue;

    const entries = result[type];
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as { asOfDate?: unknown; reportedValue?: { raw?: unknown } };
      if (typeof e.asOfDate !== "string") continue;
      const value = typeof e.reportedValue?.raw === "number" ? e.reportedValue.raw : null;

      if (!byDate.has(e.asOfDate)) {
        byDate.set(e.asOfDate, { fiscalDate: e.asOfDate, revenue: null, netIncome: null, eps: null, fcf: null });
      }
      const point = byDate.get(e.asOfDate)!;
      if (type === "annualTotalRevenue") point.revenue = value;
      else if (type === "annualNetIncome") point.netIncome = value;
      else if (type === "annualDilutedEPS") point.eps = value;
      else if (type === "annualFreeCashFlow") point.fcf = value;
    }
  }

  return [...byDate.values()].sort((a, b) => a.fiscalDate.localeCompare(b.fiscalDate));
}
