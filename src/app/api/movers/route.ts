import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, marketMoversCache } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, TTL } from "@/lib/cache";
import { getOrCreateAsset } from "@/lib/assets";
import { newId } from "@/lib/id";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readCached(category: "gainers" | "losers" | "most_active") {
  return db
    .select({
      symbol: assets.symbol,
      name: assets.name,
      changePct: marketMoversCache.changePct,
      volume: marketMoversCache.volume,
      fetchedAt: marketMoversCache.fetchedAt,
    })
    .from(marketMoversCache)
    .innerJoin(assets, eq(assets.id, marketMoversCache.assetId))
    .where(and(eq(marketMoversCache.date, today()), eq(marketMoversCache.category, category)))
    .orderBy(desc(marketMoversCache.changePct))
    .limit(25);
}

export async function GET() {
  const existingGainers = await readCached("gainers");

  if (isStale(existingGainers[0]?.fetchedAt, TTL.MOVERS_MS)) {
    try {
      const provider = getMarketDataProvider();
      const { gainers, losers, mostActive } = await provider.getGainersLosersActive();
      const date = today();
      const fetchedAt = new Date();

      const categories: Array<["gainers" | "losers" | "most_active", typeof gainers]> = [
        ["gainers", gainers],
        ["losers", losers],
        ["most_active", mostActive],
      ];

      for (const [category, quotes] of categories) {
        if (quotes.length === 0) continue;

        const resolvedAssets = await Promise.all(
          quotes.map((quote) =>
            getOrCreateAsset(quote.symbol, "stock", {
              name: quote.companyName ?? undefined,
              skipLiveValidation: true,
            }),
          ),
        );

        await db
          .insert(marketMoversCache)
          .values(
            quotes.map((quote, i) => ({
              id: newId("mover"),
              date,
              category,
              assetId: resolvedAssets[i].id,
              changePct: quote.changePct,
              volume: quote.volume,
              fetchedAt,
            })),
          )
          .onConflictDoUpdate({
            target: [
              marketMoversCache.date,
              marketMoversCache.category,
              marketMoversCache.assetId,
            ],
            set: {
              changePct: sql`excluded.change_pct`,
              volume: sql`excluded.volume`,
              fetchedAt: sql`excluded.fetched_at`,
            },
          });
      }
    } catch (error) {
      if (existingGainers.length === 0) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
    }
  }

  const [gainers, losers, mostActive] = await Promise.all([
    readCached("gainers"),
    readCached("losers"),
    readCached("most_active"),
  ]);

  return NextResponse.json({ gainers, losers, mostActive });
}
