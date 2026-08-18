import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesIntradayCache } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, isUsMarketOpen, TTL } from "@/lib/cache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const [cached] = await db
    .select()
    .from(pricesIntradayCache)
    .where(eq(pricesIntradayCache.assetId, asset.id))
    .limit(1);

  const marketStatus = isUsMarketOpen();
  const shouldRefresh =
    marketStatus === "open"
      ? isStale(cached?.fetchedAt, TTL.QUOTE_MS)
      : !cached; // fuera de horario, no se refresca si ya hay algo cacheado

  if (shouldRefresh) {
    try {
      const provider = getMarketDataProvider();
      const quote = await provider.getQuote(symbol);

      if (quote) {
        await db
          .insert(pricesIntradayCache)
          .values({
            assetId: asset.id,
            price: quote.price,
            changeAbs: quote.changeAbs,
            changePct: quote.changePct,
            dayHigh: quote.dayHigh,
            dayLow: quote.dayLow,
            volume: quote.volume,
            marketCap: quote.marketCap,
            marketStatus,
            source: quote.source,
            fetchedAt: new Date(),
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
              fetchedAt: new Date(),
            },
          });

        return NextResponse.json({
          symbol,
          companyName: quote.companyName,
          price: quote.price,
          changeAbs: quote.changeAbs,
          changePct: quote.changePct,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          marketCap: quote.marketCap,
          // No persistidos en el cache (cambian poco, no vale la pena una
          // migración de columnas); solo disponibles cuando el fetch es
          // fresco, null cuando se sirve desde cache.
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
          exchangeName: quote.exchangeName,
          marketStatus,
          source: quote.source,
          fetchedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Si falla el proveedor pero hay algo cacheado, se sirve el cache
      // marcado con su fetchedAt real en vez de inventar un dato fresco.
      if (!cached) {
        return NextResponse.json(
          { error: (error as Error).message },
          { status: 502 },
        );
      }
    }
  }

  if (!cached) {
    return NextResponse.json(
      { symbol, error: "Dato no disponible" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    symbol,
    companyName: null, // no persistido en cache
    price: cached.price,
    changeAbs: cached.changeAbs,
    changePct: cached.changePct,
    dayHigh: cached.dayHigh,
    dayLow: cached.dayLow,
    volume: cached.volume,
    marketCap: cached.marketCap,
    fiftyTwoWeekLow: null,
    fiftyTwoWeekHigh: null,
    exchangeName: null,
    marketStatus: cached.marketStatus,
    source: cached.source,
    fetchedAt: cached.fetchedAt.toISOString(),
  });
}
