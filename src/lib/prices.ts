import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricesDaily } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
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
        ? { from: daysAgo(400), to: today }
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
