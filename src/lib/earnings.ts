import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { earningsEvents } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getCalendarEvents } from "@/lib/providers/yahoo-stock-detail";
import { isStale } from "@/lib/cache";
import { newId } from "@/lib/id";

const CALENDAR_TTL_MS = 24 * 60 * 60_000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UpcomingEarnings {
  symbol: string;
  reportDate: string;
  daysUntil: number;
  epsEstimate: number | null;
  revenueEstimate: number | null;
  source: string;
  fetchedAt: string;
}

/**
 * Próximo reporte de earnings para un símbolo, cacheado en `earnings_events`
 * (TTL 24h). Compartido entre `/api/earnings-calendar/[symbol]` (una acción)
 * y `/api/earnings-calendar` (agregado de watchlist + portafolios).
 */
export async function getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null> {
  const asset = await getOrCreateAsset(symbol, "stock");

  const [upcoming] = await db
    .select()
    .from(earningsEvents)
    .where(and(eq(earningsEvents.assetId, asset.id), gte(earningsEvents.reportDate, today())))
    .orderBy(earningsEvents.reportDate)
    .limit(1);

  if (isStale(upcoming?.fetchedAt, CALENDAR_TTL_MS)) {
    try {
      const entry = await getCalendarEvents(symbol);
      if (entry) {
        await db
          .insert(earningsEvents)
          .values({
            id: newId("earn"),
            assetId: asset.id,
            reportDate: entry.reportDate,
            epsEstimate: entry.epsEstimate,
            revenueEstimate: entry.revenueEstimate,
            source: "Yahoo Finance",
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [earningsEvents.assetId, earningsEvents.reportDate],
            set: {
              epsEstimate: entry.epsEstimate,
              revenueEstimate: entry.revenueEstimate,
              fetchedAt: new Date(),
            },
          });
      }
    } catch {
      // si falla el refresh, se sirve lo que ya hubiera en cache
    }
  }

  const [current] = await db
    .select()
    .from(earningsEvents)
    .where(and(eq(earningsEvents.assetId, asset.id), gte(earningsEvents.reportDate, today())))
    .orderBy(earningsEvents.reportDate)
    .limit(1);

  if (!current) return null;

  const daysUntil = Math.ceil(
    (new Date(current.reportDate).getTime() - Date.now()) / (24 * 60 * 60_000),
  );

  return {
    symbol,
    reportDate: current.reportDate,
    daysUntil,
    epsEstimate: current.epsEstimate,
    revenueEstimate: current.revenueEstimate,
    source: current.source,
    fetchedAt: current.fetchedAt.toISOString(),
  };
}
