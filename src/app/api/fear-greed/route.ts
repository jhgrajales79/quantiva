import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { fearGreedSnapshot } from "@/lib/db/schema";
import { fetchFearGreed } from "@/lib/providers/fear-greed-provider";
import { translateFearGreedRating } from "@/lib/fear-greed";
import { isStale, TTL } from "@/lib/cache";

const SOURCE = "CNN Business";

export async function GET() {
  const [cached] = await db.select().from(fearGreedSnapshot).limit(1);

  if (isStale(cached?.fetchedAt, TTL.FEAR_GREED_MS)) {
    try {
      const snapshot = await fetchFearGreed();
      const fetchedAt = new Date();

      await db
        .insert(fearGreedSnapshot)
        .values({
          id: "latest",
          score: snapshot.score,
          rating: snapshot.rating,
          previousClose: snapshot.previousClose,
          previousWeek: snapshot.previousWeek,
          date: snapshot.timestamp.slice(0, 10),
          source: SOURCE,
          fetchedAt,
        })
        .onConflictDoUpdate({
          target: fearGreedSnapshot.id,
          set: {
            score: snapshot.score,
            rating: snapshot.rating,
            previousClose: snapshot.previousClose,
            previousWeek: snapshot.previousWeek,
            date: snapshot.timestamp.slice(0, 10),
            fetchedAt,
          },
        });
    } catch (error) {
      if (!cached) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
      // si falla el refresh, se sirve el último snapshot cacheado
    }
  }

  const [current] = await db.select().from(fearGreedSnapshot).limit(1);

  if (!current) {
    return NextResponse.json({ error: "Dato no disponible" }, { status: 404 });
  }

  return NextResponse.json({
    score: current.score,
    rating: translateFearGreedRating(current.rating),
    previousClose: current.previousClose,
    previousWeek: current.previousWeek,
    date: current.date,
    source: current.source,
    fetchedAt: current.fetchedAt.toISOString(),
  });
}
