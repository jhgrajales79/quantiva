import type { RatiosSnapshot, ValuationResult } from "./types";

/**
 * EV/EBITDA relativo: aplica el múltiplo histórico propio promedio al EBITDA
 * actual, resta deuda neta y divide por acciones en circulación.
 */
export function valueEvEbitda(
  ebitda: number | null,
  totalDebt: number | null,
  cash: number | null,
  sharesOutstanding: number | null,
  historicalRatios: RatiosSnapshot[],
): ValuationResult {
  if (ebitda === null || ebitda <= 0 || sharesOutstanding === null || sharesOutstanding <= 0) {
    return {
      model: "ev_ebitda",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: EBITDA o acciones en circulación no disponibles.",
    };
  }

  const historicalMultiples = historicalRatios
    .map((r) => r.evEbitda)
    .filter((m): m is number => m !== null && m > 0);

  if (historicalMultiples.length < 2) {
    return {
      model: "ev_ebitda",
      fairValue: null,
      assumptions: { ebitda },
      unavailableReason:
        "Dato no disponible: histórico insuficiente de EV/EBITDA para calcular un múltiplo propio.",
    };
  }

  const averageMultiple =
    historicalMultiples.reduce((sum, m) => sum + m, 0) / historicalMultiples.length;

  const enterpriseValue = averageMultiple * ebitda;
  const netDebt = (totalDebt ?? 0) - (cash ?? 0);
  const equityValue = enterpriseValue - netDebt;
  const fairValue = equityValue / sharesOutstanding;

  return {
    model: "ev_ebitda",
    fairValue,
    assumptions: {
      ebitda,
      averageHistoricalEvEbitda: averageMultiple,
      enterpriseValue,
      netDebt,
      sharesOutstanding,
      historicalSamples: historicalMultiples.length,
    },
    unavailableReason: null,
  };
}
