export interface YearlyPoint {
  fiscalDate: string; // YYYY-MM-DD
  value: number | null;
}

/**
 * CAGR entre el primer y último punto disponibles en `history` (ordenado
 * ascendente), usando el número real de años transcurridos entre esas
 * fechas — nunca se asume una ventana fija de "5 años" que no tenemos.
 * Retorna null si hay menos de 2 muestras o el punto base no es positivo.
 */
export function computeCagrFromHistory(history: YearlyPoint[]): {
  cagr: number | null;
  yearsSpan: number;
  sampleCount: number;
} {
  const withValue = history.filter((h): h is YearlyPoint & { value: number } => h.value !== null);

  if (withValue.length < 2) {
    return { cagr: null, yearsSpan: 0, sampleCount: withValue.length };
  }

  const first = withValue[0];
  const last = withValue[withValue.length - 1];
  const yearsSpan =
    (new Date(last.fiscalDate).getTime() - new Date(first.fiscalDate).getTime()) /
    (365.25 * 24 * 60 * 60_000);

  if (first.value <= 0 || yearsSpan <= 0) {
    return { cagr: null, yearsSpan, sampleCount: withValue.length };
  }

  return {
    cagr: Math.pow(last.value / first.value, 1 / yearsSpan) - 1,
    yearsSpan,
    sampleCount: withValue.length,
  };
}
