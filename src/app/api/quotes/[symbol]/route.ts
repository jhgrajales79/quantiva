import { NextResponse } from "next/server";
import { getOrCreateAsset } from "@/lib/assets";
import { getFreshQuote } from "@/lib/prices";
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

  const quote = await getFreshQuote(symbol, asset.id);

  if (!quote) {
    return NextResponse.json(
      { symbol, error: "Dato no disponible" },
      { status: 404 },
    );
  }

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
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        exchangeName: quote.exchangeName,
        marketStatus: quote.marketStatus,
        source: quote.source,
        fetchedAt: quote.fetchedAt.toISOString(),
      },
      symbol,
      quote.marketStatus,
    ),
  );
}
