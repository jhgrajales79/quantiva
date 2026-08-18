import type { ValuationModel, ValuationResult } from "./types";

// Pesos por defecto del spec del usuario, redistribuidos entre los 5 modelos
// activos en el MVP (DDM y Multiples Composite quedan para Fase 2).
const DEFAULT_WEIGHTS: Record<ValuationModel, number> = {
  dcf: 0.4,
  pe_relative: 0.2,
  ev_ebitda: 0.2,
  ps: 0.1,
  graham: 0.1,
};

export interface ConsensusResult {
  fairValueConsensus: number | null;
  upsidePct: number | null;
  marginOfSafetyPrice: number | null;
  modelsUsed: { model: ValuationModel; fairValue: number; weight: number }[];
  modelsUnavailable: { model: ValuationModel; reason: string }[];
}

/**
 * Combina los modelos disponibles con pesos re-normalizados sobre los que sí
 * arrojaron un valor (nunca se rellena un modelo faltante con un supuesto).
 */
export function computeConsensus(
  results: ValuationResult[],
  currentPrice: number,
  marginOfSafetyPct = 0.2,
  weights: Partial<Record<ValuationModel, number>> = DEFAULT_WEIGHTS,
): ConsensusResult {
  const available = results.filter(
    (r): r is ValuationResult & { fairValue: number } => r.fairValue !== null,
  );
  const unavailable = results
    .filter((r) => r.fairValue === null)
    .map((r) => ({ model: r.model, reason: r.unavailableReason ?? "Dato no disponible." }));

  if (available.length === 0) {
    return {
      fairValueConsensus: null,
      upsidePct: null,
      marginOfSafetyPrice: null,
      modelsUsed: [],
      modelsUnavailable: unavailable,
    };
  }

  const totalWeight = available.reduce(
    (sum, r) => sum + (weights[r.model] ?? 0),
    0,
  );

  const modelsUsed = available.map((r) => ({
    model: r.model,
    fairValue: r.fairValue,
    weight: totalWeight > 0 ? (weights[r.model] ?? 0) / totalWeight : 1 / available.length,
  }));

  const fairValueConsensus = modelsUsed.reduce(
    (sum, m) => sum + m.fairValue * m.weight,
    0,
  );

  const upsidePct = (fairValueConsensus - currentPrice) / currentPrice;
  const marginOfSafetyPrice = fairValueConsensus * (1 - marginOfSafetyPct);

  return {
    fairValueConsensus,
    upsidePct,
    marginOfSafetyPrice,
    modelsUsed,
    modelsUnavailable: unavailable,
  };
}

export type ValuationBadge =
  | "great_discount"
  | "discount"
  | "fair_price"
  | "overvalued"
  | "very_overvalued";

export function valuationBadge(upsidePct: number | null): ValuationBadge | null {
  if (upsidePct === null) return null;
  if (upsidePct >= 0.4) return "great_discount";
  if (upsidePct >= 0.15) return "discount";
  if (upsidePct >= -0.1) return "fair_price";
  if (upsidePct >= -0.3) return "overvalued";
  return "very_overvalued";
}
