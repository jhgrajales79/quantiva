export interface HistoricalComparison {
  current: number | null;
  average: number | null;
  sampleCount: number;
  vsAveragePct: number | null; // (current - average) / |average|
  unavailable: boolean;
  reason: string | null;
}

const MIN_SAMPLES = 2;

/**
 * Compara el valor actual de una métrica contra el promedio de su propio
 * historial acumulado (mismo criterio que ya usan los modelos relativos del
 * Fair Value Engine: se requieren al menos 2 muestras históricas, nunca se
 * inventa un promedio "de 5 años" que no tenemos todavía).
 */
export function computeHistoricalComparison(
  current: number | null,
  historicalValues: (number | null)[],
): HistoricalComparison {
  if (current === null) {
    return {
      current: null,
      average: null,
      sampleCount: 0,
      vsAveragePct: null,
      unavailable: true,
      reason: "Dato no disponible: valor actual no disponible.",
    };
  }

  const samples = historicalValues.filter((v): v is number => v !== null);

  if (samples.length < MIN_SAMPLES) {
    return {
      current,
      average: null,
      sampleCount: samples.length,
      vsAveragePct: null,
      unavailable: true,
      reason: "Historial insuficiente para comparar contra el promedio propio.",
    };
  }

  const average = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  const vsAveragePct = average !== 0 ? (current - average) / Math.abs(average) : null;

  return {
    current,
    average,
    sampleCount: samples.length,
    vsAveragePct,
    unavailable: false,
    reason: null,
  };
}
