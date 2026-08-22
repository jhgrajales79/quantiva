import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, screenerSnapshots, pricesIntradayCache } from "@/lib/db/schema";
import { refreshMarketBreadth } from "@/lib/providers/refresh-market-breadth";
import { batchGetQuotes } from "@/lib/providers/yahoo-batch-quote";
import { getCryptoDataProvider } from "@/lib/providers/registry";
import { getOrCreateAsset } from "@/lib/assets";
import { ETF_UNIVERSE } from "@/lib/providers/etf-universe";
import { isStale, isUsMarketOpen, TTL } from "@/lib/cache";

export interface HeatmapTile {
  symbol: string;
  name: string;
  marketCap: number | null;
  changePct: number | null;
}

const STOCK_TILE_LIMIT = 60;
const CRYPTO_TILE_LIMIT = 50;

/**
 * Reusa el mismo snapshot diario que ya alimenta el Screener (§ refresh de
 * amplitud de mercado) — no se vuelve a golpear a Yahoo aparte, solo se lee
 * (y se ordena por market cap) lo que esa rutina ya cachea para las ~505
 * acciones del S&P 500.
 */
async function getStockTiles(): Promise<HeatmapTile[]> {
  let [latestRow] = await db
    .select({ date: screenerSnapshots.date, fetchedAt: screenerSnapshots.fetchedAt })
    .from(screenerSnapshots)
    .orderBy(desc(screenerSnapshots.date))
    .limit(1);

  if (isStale(latestRow?.fetchedAt, TTL.MARKET_BREADTH_MS)) {
    try {
      await refreshMarketBreadth();
      [latestRow] = await db
        .select({ date: screenerSnapshots.date, fetchedAt: screenerSnapshots.fetchedAt })
        .from(screenerSnapshots)
        .orderBy(desc(screenerSnapshots.date))
        .limit(1);
    } catch {
      // best-effort: si falla el refresh, se sigue con el último snapshot cacheado
    }
  }

  if (!latestRow) return [];

  const rows = await db
    .select({
      symbol: assets.symbol,
      name: assets.name,
      marketCap: screenerSnapshots.marketCap,
      changePct: screenerSnapshots.changePct,
    })
    .from(screenerSnapshots)
    .innerJoin(assets, eq(assets.id, screenerSnapshots.assetId))
    .where(eq(screenerSnapshots.date, latestRow.date));

  return rows
    .filter((r): r is typeof r & { marketCap: number } => r.marketCap !== null)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, STOCK_TILE_LIMIT);
}

async function getCryptoTiles(): Promise<HeatmapTile[]> {
  const coins = await getCryptoDataProvider().getTopByMarketCap(CRYPTO_TILE_LIMIT);
  return coins.map((c) => ({
    symbol: c.symbol,
    name: c.name,
    marketCap: c.marketCap,
    changePct: c.change24hPct,
  }));
}

/**
 * El universo de ETFs se refresca junto (un solo batch de Yahoo v7/quote,
 * el único endpoint que sí trae market cap) y se cachea en
 * prices_intraday_cache igual que cualquier cotización individual — así
 * este endpoint no golpea a Yahoo en cada carga del dashboard.
 */
async function getEtfTiles(): Promise<HeatmapTile[]> {
  const etfAssets = await Promise.all(
    ETF_UNIVERSE.map((e) => getOrCreateAsset(e.symbol, "etf", { name: e.label, skipLiveValidation: true })),
  );
  const assetIds = etfAssets.map((a) => a.id);

  let cached = await db
    .select()
    .from(pricesIntradayCache)
    .where(inArray(pricesIntradayCache.assetId, assetIds));

  const oldestFetchedAt = cached.reduce(
    (min, r) => (r.fetchedAt < min ? r.fetchedAt : min),
    cached[0]?.fetchedAt ?? null,
  );
  const stale = cached.length < etfAssets.length || isStale(oldestFetchedAt, TTL.HEATMAP_ETF_MS);

  if (stale) {
    try {
      const quotes = await batchGetQuotes(ETF_UNIVERSE.map((e) => e.symbol));
      const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
      const fetchedAt = new Date();
      const marketStatus = isUsMarketOpen();

      for (let i = 0; i < ETF_UNIVERSE.length; i += 1) {
        const q = bySymbol.get(ETF_UNIVERSE[i].symbol);
        if (!q || q.regularMarketPrice === null) continue;
        const assetId = etfAssets[i].id;
        // Los ETFs son fondos, no empresas: Yahoo no les da `marketCap`
        // (siempre null), reporta el tamaño del fondo en `netAssets` /
        // `totalAssets`. Se usa ese valor como métrica de tamaño de la celda.
        const size = q.marketCap ?? q.netAssets ?? q.totalAssets;
        await db
          .insert(pricesIntradayCache)
          .values({
            assetId,
            price: q.regularMarketPrice,
            changePct: q.regularMarketChangePercent,
            marketCap: size,
            marketStatus,
            source: "Yahoo Finance",
            fetchedAt,
          })
          .onConflictDoUpdate({
            target: pricesIntradayCache.assetId,
            set: {
              price: q.regularMarketPrice,
              changePct: q.regularMarketChangePercent,
              marketCap: size,
              marketStatus,
              fetchedAt,
            },
          });
      }

      cached = await db
        .select()
        .from(pricesIntradayCache)
        .where(inArray(pricesIntradayCache.assetId, assetIds));
    } catch {
      // best-effort: si falla el batch, se sigue con lo que ya hubiera cacheado
    }
  }

  const cachedByAsset = new Map(cached.map((r) => [r.assetId, r]));

  return ETF_UNIVERSE.map((etf, i) => {
    const row = cachedByAsset.get(etfAssets[i].id);
    if (!row) return null;
    return { symbol: etf.symbol, name: etf.label, marketCap: row.marketCap, changePct: row.changePct };
  }).filter((t): t is HeatmapTile => t !== null);
}

export async function GET(request: Request) {
  const category = new URL(request.url).searchParams.get("category") ?? "stocks";

  try {
    const tiles =
      category === "crypto" ? await getCryptoTiles() : category === "etf" ? await getEtfTiles() : await getStockTiles();
    return NextResponse.json({ category, tiles });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
