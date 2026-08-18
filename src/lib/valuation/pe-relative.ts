import type { RatiosSnapshot, ValuationResult } from "./types";

/**
 * P/E relativo: compara el P/E actual contra el promedio histórico propio del
 * activo (no inventamos un "P/E de sector" sin una fuente real de ese dato).
 * Requiere al menos 2 snapshots históricos de ratios además del actual.
 */
export function valuePeRelative(
  eps: number | null,
  historicalRatios: RatiosSnapshot[],
): ValuationResult {
  if (eps === null || eps <= 0) {
    return {
      model: "pe_relative",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: EPS no disponible o negativo.",
    };
  }

  const historicalPe = historicalRatios
    .map((r) => r.pe)
    .filter((pe): pe is number => pe !== null && pe > 0);

  if (historicalPe.length < 2) {
    return {
      model: "pe_relative",
      fairValue: null,
      assumptions: { eps },
      unavailableReason:
        "Dato no disponible: histórico insuficiente de P/E para calcular un promedio propio.",
    };
  }

  const averagePe =
    historicalPe.reduce((sum, pe) => sum + pe, 0) / historicalPe.length;

  return {
    model: "pe_relative",
    fairValue: averagePe * eps,
    assumptions: {
      eps,
      averageHistoricalPe: averagePe,
      historicalSamples: historicalPe.length,
    },
    unavailableReason: null,
  };
}
