import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesDaily } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { newId } from "@/lib/id";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
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
        ? { from: daysAgo(400), to: today }
        : { from: latest!.date, to: today };

      const points = await provider.getDailyPrices(symbol, range);

      for (const point of points) {
        await db
          .insert(pricesDaily)
          .values({
            id: newId("price"),
            assetId: asset.id,
            date: point.date,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
            volume: point.volume,
            source: provider.name,
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [pricesDaily.assetId, pricesDaily.date],
            set: {
              open: point.open,
              high: point.high,
              low: point.low,
              close: point.close,
              volume: point.volume,
              fetchedAt: new Date(),
            },
          });
      }
    } catch (error) {
      if (!latest) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
      // si falla el top-up, se sirve el histórico que ya hubiera
    }
  }

  const history = await db
    .select()
    .from(pricesDaily)
    .where(eq(pricesDaily.assetId, asset.id))
    .orderBy(asc(pricesDaily.date));

  return NextResponse.json({
    symbol,
    prices: history.map((p) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    })),
  });
}
