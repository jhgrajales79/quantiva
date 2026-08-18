export interface DividendPoint {
  exDate: string; // YYYY-MM-DD
  amount: number;
}

/** Suma de dividendos pagados en los últimos 12 meses desde la fecha más reciente. */
export function computeDpsTtm(dividends: DividendPoint[]): number | null {
  if (dividends.length === 0) return null;

  const sorted = [...dividends].sort((a, b) => b.exDate.localeCompare(a.exDate));
  const latestDate = new Date(sorted[0].exDate);
  const cutoff = new Date(latestDate);
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const inWindow = sorted.filter((d) => new Date(d.exDate) > cutoff);
  if (inWindow.length === 0) return null;

  return inWindow.reduce((sum, d) => sum + d.amount, 0);
}

/**
 * CAGR del dividendo entre el DPS TTM más reciente y el de hace `years`
 * años (aproximado sumando los 12 meses que terminan justo antes de esa
 * fecha). Retorna null si no hay suficiente historial para esa ventana —
 * nunca se aproxima con menos años de los pedidos.
 */
export function computeDividendCagr(dividends: DividendPoint[], years: number): number | null {
  if (dividends.length === 0) return null;

  const sorted = [...dividends].sort((a, b) => a.exDate.localeCompare(b.exDate));
  const latestDate = new Date(sorted[sorted.length - 1].exDate);

  const recentTtm = computeDpsTtm(dividends);
  if (recentTtm === null || recentTtm <= 0) return null;

  const pastCutoffEnd = new Date(latestDate);
  pastCutoffEnd.setFullYear(pastCutoffEnd.getFullYear() - years);
  const pastCutoffStart = new Date(pastCutoffEnd);
  pastCutoffStart.setFullYear(pastCutoffStart.getFullYear() - 1);

  const pastWindow = sorted.filter((d) => {
    const date = new Date(d.exDate);
    return date > pastCutoffStart && date <= pastCutoffEnd;
  });

  if (pastWindow.length === 0) return null;

  const pastTtm = pastWindow.reduce((sum, d) => sum + d.amount, 0);
  if (pastTtm <= 0) return null;

  return Math.pow(recentTtm / pastTtm, 1 / years) - 1;
}
