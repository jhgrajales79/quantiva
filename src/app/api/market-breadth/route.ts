import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { marketBreadthSnapshots } from "@/lib/db/schema";
import { refreshMarketBreadth } from "@/lib/providers/refresh-market-breadth";
import { isStale, TTL } from "@/lib/cache";

export async function GET() {
  const [latest] = await db
    .select()
    .from(marketBreadthSnapshots)
    .orderBy(desc(marketBreadthSnapshots.date))
    .limit(1);

  let current = latest;

  if (isStale(latest?.fetchedAt, TTL.MARKET_BREADTH_MS)) {
    try {
      await refreshMarketBreadth();
      [current] = await db
        .select()
        .from(marketBreadthSnapshots)
        .orderBy(desc(marketBreadthSnapshots.date))
        .limit(1);
    } catch (error) {
      if (!latest) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
      // si falla el refresh, se sirve el último snapshot cacheado
    }
  }

  if (!current) {
    return NextResponse.json({ error: "Dato no disponible" }, { status: 404 });
  }

  return NextResponse.json({
    date: current.date,
    advancing: current.advancing,
    declining: current.declining,
    pctAboveMa50: current.pctAboveMa50,
    pctAboveMa200: current.pctAboveMa200,
    newHighs52w: current.newHighs52w,
    newLows52w: current.newLows52w,
    universeSize: current.universeSize,
    source: current.source,
    fetchedAt: current.fetchedAt.toISOString(),
  });
}
