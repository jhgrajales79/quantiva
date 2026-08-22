import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesIntradayCache } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, isUsMarketOpen, TTL } from "@/lib/cache";
import type { MarketStatus } from "@/lib/cache";
import { getExtendedQuote } from "@/lib/providers/yahoo-extended-quote";

/**
 * El precio "regular" (regularMarketPrice) se queda fijo en el cierre de la
 * sesión mientras dura el pre-market/after-hours — el precio que sí sigue
 * moviéndose en esas ventanas requiere el endpoint v7/quote (con crumb), no
 * el /chart que usa el proveedor por defecto. Se pide best-effort y solo
 * fuera de horario regular, para no gastar una llamada extra en cada
 * cotización durante la sesión normal (donde nunca hay dato pre/post).
 */
async function attachExtendedHours(
  base: Record<string, unknown>,
  symbol: string,
  marketStatus: MarketStatus,
) {
  if (marketStatus !== "pre-market" && marketStatus !== "after-hours") return base;
  try {
    const extended = await getExtendedQuote(symbol);
    if (!extended) return base;
    if (extended.marketState === "PRE" && extended.preMarketPrice !== null) {
      return {
        ...base,
        extendedHours: {
          label: "Antes de la apertura",
          price: extended.preMarketPrice,
          changeAbs: extended.preMarketChange,
          changePct: extended.preMarketChangePercent,
        },
      };
    }
    if (extended.marketState === "POST" && extended.postMarketPrice !== null) {
      return {
        ...base,
        extendedHours: {
          label: "Tras el cierre",
          price: extended.postMarketPrice,
          changeAbs: extended.postMarketChange,
          changePct: extended.postMarketChangePercent,
        },
      };
    }
  } catch {
    // best-effort: si falla el endpoint con crumb, se sirve el precio
    // regular sin dato extendido en vez de romper la cotización completa.
  }
  return base;
}

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
  // TTL según fase: 1 min en sesión regular, 5 min en pre-market/after-hours
  // (el precio sigue moviéndose, con menos volumen), 30 min con el mercado
  // totalmente cerrado (nada se mueve, pero igual se refresca cada tanto).
  // Antes "closed"/"pre-market"/"after-hours" nunca refrescaban si ya había
  // algo cacheado, lo que dejaba congelado indefinidamente un precio
  // intradía viejo en vez de mostrar el cierre real o el precio extendido
  // en cuanto terminaba la sesión regular.
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

        return NextResponse.json(
          await attachExtendedHours(
            {
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
            },
            symbol,
            marketStatus,
          ),
        );
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

  return NextResponse.json(
    await attachExtendedHours(
      {
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
      },
      symbol,
      marketStatus, // estado en vivo, no el guardado en cache al momento del fetch
    ),
  );
}
