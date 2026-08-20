import { db } from "@/lib/db/client";
import { marketBreadthSnapshots, screenerSnapshots } from "@/lib/db/schema";
import { SP500_CONSTITUENTS } from "@/lib/providers/sp500-constituents";
import { SP500_SECTORS } from "@/lib/providers/sp500-sectors";
import { batchGetQuotes } from "@/lib/providers/yahoo-batch-quote";
import { aggregateBreadth } from "@/lib/market-breadth";
import { getOrCreateAsset } from "@/lib/assets";
import { sql } from "drizzle-orm";

const SOURCE = "Yahoo Finance (S&P 500 constituents snapshot)";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Recalcula la amplitud de mercado Y el universo del Screener a partir de la
 * MISMA consulta en lote a los ~500 constituyentes del S&P 500 (no se pide
 * nada nuevo a Yahoo por separado). Persiste ambos snapshots del día.
 * Compartido entre las rutas on-demand (`/api/market-breadth`,
 * `/api/screener`) y el cron diario.
 */
export async function refreshMarketBreadth() {
  const quotes = await batchGetQuotes(SP500_CONSTITUENTS);
  const aggregate = aggregateBreadth(quotes);
  const date = today();
  const fetchedAt = new Date();

  await db
    .insert(marketBreadthSnapshots)
    .values({
      date,
      advancing: aggregate.advancing,
      declining: aggregate.declining,
      pctAboveMa50: aggregate.pctAboveMa50,
      pctAboveMa200: aggregate.pctAboveMa200,
      newHighs52w: aggregate.newHighs52w,
      newLows52w: aggregate.newLows52w,
      universeSize: aggregate.universeSize,
      source: SOURCE,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: marketBreadthSnapshots.date,
      set: {
        advancing: aggregate.advancing,
        declining: aggregate.declining,
        pctAboveMa50: aggregate.pctAboveMa50,
        pctAboveMa200: aggregate.pctAboveMa200,
        newHighs52w: aggregate.newHighs52w,
        newLows52w: aggregate.newLows52w,
        universeSize: aggregate.universeSize,
        fetchedAt,
      },
    });

  const assetsBySymbol = await Promise.all(
    quotes.map((q) => getOrCreateAsset(q.symbol, "stock", { skipLiveValidation: true })),
  );

  if (quotes.length > 0) {
    await db
      .insert(screenerSnapshots)
      .values(
        quotes.map((q, i) => ({
          date,
          assetId: assetsBySymbol[i].id,
          sector: SP500_SECTORS[q.symbol] ?? null,
          price: q.regularMarketPrice,
          changePct: q.regularMarketChangePercent,
          marketCap: q.marketCap,
          pe: q.trailingPE,
          forwardPe: q.forwardPE,
          pb: q.priceToBook,
          // v7/finance/quote expresa dividendYield en puntos porcentuales (ej. 4.2 = 4.2%),
          // a diferencia de quoteSummary (fracción). Se normaliza a fracción para
          // mantener la misma convención que ratios.dividendYield en el resto de la app.
          dividendYield: q.dividendYield !== null ? q.dividendYield / 100 : null,
          ma50: q.fiftyDayAverage,
          ma200: q.twoHundredDayAverage,
          fiftyTwoWeekLow: q.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
          avgVolume10d: q.averageDailyVolume10Day,
          avgVolume3m: q.averageDailyVolume3Month,
          fetchedAt,
        })),
      )
      .onConflictDoUpdate({
        target: [screenerSnapshots.date, screenerSnapshots.assetId],
        set: {
          sector: sql`excluded.sector`,
          price: sql`excluded.price`,
          changePct: sql`excluded.change_pct`,
          marketCap: sql`excluded.market_cap`,
          pe: sql`excluded.pe`,
          forwardPe: sql`excluded.forward_pe`,
          pb: sql`excluded.pb`,
          dividendYield: sql`excluded.dividend_yield`,
          ma50: sql`excluded.ma50`,
          ma200: sql`excluded.ma200`,
          fiftyTwoWeekLow: sql`excluded.fifty_two_week_low`,
          fiftyTwoWeekHigh: sql`excluded.fifty_two_week_high`,
          avgVolume10d: sql`excluded.avg_volume_10d`,
          avgVolume3m: sql`excluded.avg_volume_3m`,
          fetchedAt: sql`excluded.fetched_at`,
        },
      });
  }

  return { date, ...aggregate, source: SOURCE, fetchedAt };
}
