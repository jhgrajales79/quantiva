export interface MacroPoint {
  date: string;
  value: number | null;
}

/**
 * Variación porcentual interanual (YoY) entre el dato más reciente y el de
 * `periodsBack` observaciones atrás (12 para series mensuales como CPI, 4
 * para series trimestrales como PIB). `history` debe venir ascendente por
 * fecha. Retorna null si no hay suficiente historial — nunca se aproxima.
 */
export function computeYoyChange(history: MacroPoint[], periodsBack: number): number | null {
  if (history.length <= periodsBack) return null;
  const latest = history[history.length - 1];
  const base = history[history.length - 1 - periodsBack];
  if (latest.value === null || base.value === null || base.value === 0) return null;
  return (latest.value - base.value) / Math.abs(base.value);
}
