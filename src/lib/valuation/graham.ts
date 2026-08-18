import type { ValuationResult } from "./types";

/**
 * Graham Number clásico: sqrt(22.5 × EPS × Book Value per Share).
 * 22.5 = P/E máximo de 15 × P/B máximo de 1.5 según el criterio original de
 * Benjamin Graham. Solo aplica a empresas con EPS y book value positivos.
 */
export function valueGraham(
  eps: number | null,
  bookValuePerShare: number | null,
): ValuationResult {
  if (eps === null || eps <= 0 || bookValuePerShare === null || bookValuePerShare <= 0) {
    return {
      model: "graham",
      fairValue: null,
      assumptions: {},
      unavailableReason:
        "Dato no disponible: EPS o valor en libros por acción no disponibles/negativos.",
    };
  }

  const fairValue = Math.sqrt(22.5 * eps * bookValuePerShare);

  return {
    model: "graham",
    fairValue,
    assumptions: { eps, bookValuePerShare, multiplier: 22.5 },
    unavailableReason: null,
  };
}
