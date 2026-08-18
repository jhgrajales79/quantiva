import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, pricesIntradayCache } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { isUsMarketOpen } from "@/lib/cache";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const marketStatus = isUsMarketOpen();
  if (marketStatus !== "open") {
    return NextResponse.json({ skipped: true, reason: "Mercado cerrado", marketStatus });
  }

  const provider = getMarketDataProvider();
  const trackedAssets = await db
    .select({ id: assets.id, symbol: assets.symbol })
    .from(assets)
    .where(eq(assets.assetType, "stock"));

  let updated = 0;
  const errors: string[] = [];

  for (const asset of trackedAssets) {
    try {
      const quote = await provider.getQuote(asset.symbol);
      if (!quote) continue;

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
      updated += 1;
    } catch (error) {
      errors.push(`${asset.symbol}: ${(error as Error).message}`);
    }
  }

  return NextResponse.json({ updated, total: trackedAssets.length, errors });
}
