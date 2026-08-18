import type { BatchQuoteItem } from "@/lib/providers/yahoo-batch-quote";

export interface MarketBreadthAggregate {
  advancing: number;
  declining: number;
  pctAboveMa50: number;
  pctAboveMa200: number;
  newHighs52w: number;
  newLows52w: number;
  universeSize: number;
}

/**
 * Agrega quotes en lote en estadísticas de amplitud de mercado. Cada campo
 * solo cuenta las acciones para las que Yahoo realmente devolvió el dato
 * necesario (nunca se asume "por debajo de la media" cuando el dato falta).
 */
export function aggregateBreadth(quotes: BatchQuoteItem[]): MarketBreadthAggregate {
  let advancing = 0;
  let declining = 0;
  let aboveMa50 = 0;
  let belowOrAtMa50 = 0;
  let aboveMa200 = 0;
  let belowOrAtMa200 = 0;
  let newHighs52w = 0;
  let newLows52w = 0;

  for (const q of quotes) {
    if (q.regularMarketChangePercent !== null) {
      if (q.regularMarketChangePercent > 0) advancing += 1;
      else if (q.regularMarketChangePercent < 0) declining += 1;
    }

    if (q.regularMarketPrice !== null && q.fiftyDayAverage !== null) {
      if (q.regularMarketPrice > q.fiftyDayAverage) aboveMa50 += 1;
      else belowOrAtMa50 += 1;
    }

    if (q.regularMarketPrice !== null && q.twoHundredDayAverage !== null) {
      if (q.regularMarketPrice > q.twoHundredDayAverage) aboveMa200 += 1;
      else belowOrAtMa200 += 1;
    }

    if (q.regularMarketPrice !== null && q.fiftyTwoWeekHigh !== null) {
      if (q.regularMarketPrice >= q.fiftyTwoWeekHigh) newHighs52w += 1;
    }
    if (q.regularMarketPrice !== null && q.fiftyTwoWeekLow !== null) {
      if (q.regularMarketPrice <= q.fiftyTwoWeekLow) newLows52w += 1;
    }
  }

  const ma50Total = aboveMa50 + belowOrAtMa50;
  const ma200Total = aboveMa200 + belowOrAtMa200;

  return {
    advancing,
    declining,
    pctAboveMa50: ma50Total > 0 ? aboveMa50 / ma50Total : 0,
    pctAboveMa200: ma200Total > 0 ? aboveMa200 / ma200Total : 0,
    newHighs52w,
    newLows52w,
    universeSize: quotes.length,
  };
}
