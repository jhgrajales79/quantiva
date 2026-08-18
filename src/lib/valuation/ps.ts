import type { RatiosSnapshot, ValuationResult } from "./types";

/**
 * P/S relativo: útil para empresas de crecimiento o con beneficios negativos
 * donde P/E y DCF no son confiables.
 */
export function valuePs(
  revenue: number | null,
  sharesOutstanding: number | null,
  historicalRatios: RatiosSnapshot[],
): ValuationResult {
  if (
    revenue === null ||
    revenue <= 0 ||
    sharesOutstanding === null ||
    sharesOutstanding <= 0
  ) {
    return {
      model: "ps",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: revenue o acciones en circulación no disponibles.",
    };
  }

  const historicalPs = historicalRatios
    .map((r) => r.ps)
    .filter((ps): ps is number => ps !== null && ps > 0);

  if (historicalPs.length < 2) {
    return {
      model: "ps",
      fairValue: null,
      assumptions: { revenue },
      unavailableReason:
        "Dato no disponible: histórico insuficiente de P/S para calcular un promedio propio.",
    };
  }

  const averagePs = historicalPs.reduce((sum, ps) => sum + ps, 0) / historicalPs.length;
  const revenuePerShare = revenue / sharesOutstanding;

  return {
    model: "ps",
    fairValue: averagePs * revenuePerShare,
    assumptions: {
      revenuePerShare,
      averageHistoricalPs: averagePs,
      historicalSamples: historicalPs.length,
    },
    unavailableReason: null,
  };
}
