import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesDaily, pricesIntradayCache } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, isUsMarketOpen, TTL } from "@/lib/cache";
import type { MarketStatus } from "@/lib/cache";
import { newId } from "@/lib/id";
import type { PricePoint } from "@/lib/providers/types";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Garantiza que `prices_daily` tenga histórico reciente para `symbol`
 * (backfill completo si nunca se consultó, top-up incremental si el último
 * dato tiene más de 2 días) y devuelve la serie completa ordenada por fecha.
 * Reutilizado por la ruta de precios y por la rotación sectorial — nunca se
 * llama al proveedor externo dos veces para el mismo símbolo en el mismo
 * request gracias al cache en Postgres.
 */
export async function getDailyPriceHistory(symbol: string): Promise<PricePoint[]> {
  const asset = await getOrCreateAsset(symbol, "stock");

  const [latest] = await db
    .select({ date: pricesDaily.date })
    .from(pricesDaily)
    .where(eq(pricesDaily.assetId, asset.id))
    .orderBy(desc(pricesDaily.date))
    .limit(1);

  const today = new Date().toISOString().slice(0, 10);
  const needsBackfill = !latest;
  const needsTopUp = latest && latest.date < daysAgo(2);

  if (needsBackfill || needsTopUp) {
    try {
      const provider = getMarketDataProvider();
      const range = needsBackfill
        ? { from: daysAgo(3700), to: today } // ~10 años, para soportar rangos largos en el gráfico
        : { from: latest!.date, to: today };

      const points = await provider.getDailyPrices(symbol, range);

      if (points.length > 0) {
        const fetchedAt = new Date();
        await db
          .insert(pricesDaily)
          .values(
            points.map((point) => ({
              id: newId("price"),
              assetId: asset.id,
              date: point.date,
              open: point.open,
              high: point.high,
              low: point.low,
              close: point.close,
              volume: point.volume,
              source: provider.name,
              fetchedAt,
            })),
          )
          .onConflictDoUpdate({
            target: [pricesDaily.assetId, pricesDaily.date],
            set: {
              open: sql`excluded.open`,
              high: sql`excluded.high`,
              low: sql`excluded.low`,
              close: sql`excluded.close`,
              volume: sql`excluded.volume`,
              fetchedAt: sql`excluded.fetched_at`,
            },
          });
      }
    } catch (error) {
      if (!latest) throw error;
      // si falla el top-up, se sirve el histórico que ya hubiera
    }
  }

  const history = await db
    .select()
    .from(pricesDaily)
    .where(eq(pricesDaily.assetId, asset.id))
    .orderBy(asc(pricesDaily.date));

  return history.map((p) => ({
    date: p.date,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
    volume: p.volume,
  }));
}

export interface FreshQuote {
  price: number | null;
  changeAbs: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  marketStatus: MarketStatus;
  companyName: string | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  exchangeName: string | null;
  source: string | null;
  fetchedAt: Date;
}

/**
 * Cotización intradía con cache en `prices_intraday_cache`, refrescada según
 * la fase de mercado (1 min en sesión regular, 5 min en pre/after-hours, 30
 * min con el mercado cerrado). Punto único de verdad para el precio actual
 * de un activo — usado por /api/quotes/[symbol] y por el cálculo de
 * holdings del portafolio, para que este último nunca lea directo una fila
 * de caché potencialmente vieja sin darle la oportunidad de refrescarse.
 */
export async function getFreshQuote(symbol: string, assetId: string): Promise<FreshQuote | null> {
  const [cached] = await db
    .select()
    .from(pricesIntradayCache)
    .where(eq(pricesIntradayCache.assetId, assetId))
    .limit(1);

  const marketStatus = isUsMarketOpen();
  const refreshTtlMs =
    marketStatus === "open"
      ? TTL.QUOTE_MS
      : marketStatus === "closed"
        ? TTL.CLOSED_QUOTE_MS
        : TTL.EXTENDED_QUOTE_MS;
  const shouldRefresh = isStale(cached?.fetchedAt, refreshTtlMs);

  if (shouldRefresh) {
    try {
      const provider = getMarketDataProvider();
      const quote = await provider.getQuote(symbol);

      if (quote) {
        const fetchedAt = new Date();
        await db
          .insert(pricesIntradayCache)
          .values({
            assetId,
            price: quote.price,
            changeAbs: quote.changeAbs,
            changePct: quote.changePct,
            dayHigh: quote.dayHigh,
            dayLow: quote.dayLow,
            volume: quote.volume,
            marketCap: quote.marketCap,
            marketStatus,
            source: quote.source,
            fetchedAt,
          })
          .onConflictDoUpdate({
            target: pricesIntradayCache.assetId,
            set: {
              price: quote.price,
              changeAbs: quote.changeAbs,
              changePct: quote.changePct,
              dayHigh: quote.dayHigh,
              dayLow: quote.dayLow,
              volume: quote.volume,
              marketCap: quote.marketCap,
              marketStatus,
              source: quote.source,
              fetchedAt,
            },
          });

        return {
          price: quote.price,
          changeAbs: quote.changeAbs,
          changePct: quote.changePct,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          marketCap: quote.marketCap,
          marketStatus,
          companyName: quote.companyName,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          exchangeName: quote.exchangeName,
          source: quote.source,
          fetchedAt,
        };
      }
    } catch {
      // Si falla el proveedor pero hay algo cacheado, se sirve el cache en
      // vez de romper la lectura completa (Watchlist/portafolio con muchos
      // símbolos no deben fallar entero por un solo ticker problemático).
    }
  }

  if (!cached) return null;

  return {
    price: cached.price,
    changeAbs: cached.changeAbs,
    changePct: cached.changePct,
    dayHigh: cached.dayHigh,
    dayLow: cached.dayLow,
    volume: cached.volume,
    marketCap: cached.marketCap,
    marketStatus: cached.marketStatus as MarketStatus,
    companyName: null, // no persistido en cache
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    exchangeName: null,
    source: cached.source,
    fetchedAt: cached.fetchedAt,
  };
}
