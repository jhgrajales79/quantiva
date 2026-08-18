import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesIntradayCache } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { getStockOverview, getForwardEpsEstimate } from "@/lib/providers/yahoo-stock-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const [cachedQuote] = await db
    .select()
    .from(pricesIntradayCache)
    .where(eq(pricesIntradayCache.assetId, asset.id))
    .limit(1);

  const currentPrice =
    cachedQuote?.price ?? (await getMarketDataProvider().getQuote(symbol).catch(() => null))?.price ?? null;

  if (currentPrice === null) {
    return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
  }

  try {
    const [overview, forwardEpsEstimate] = await Promise.all([
      getStockOverview(symbol, currentPrice),
      getForwardEpsEstimate(symbol).catch(() => null),
    ]);
    const forwardPe = forwardEpsEstimate && forwardEpsEstimate > 0 ? currentPrice / forwardEpsEstimate : null;

    return NextResponse.json({
      symbol,
      ...overview,
      forwardEpsEstimate,
      forwardPe,
      source: "Yahoo Finance",
    });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
