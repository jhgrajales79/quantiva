import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, watchlistItems, watchlists } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function getOrCreateDefaultWatchlist(userId: string) {
  const [existing] = await db
    .select()
    .from(watchlists)
    .where(eq(watchlists.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(watchlists)
    .values({ id: newId("wl"), userId, name: "Mi Watchlist" })
    .returning();

  return created;
}

export async function getWatchlistSymbols(userId: string): Promise<string[]> {
  const watchlist = await getOrCreateDefaultWatchlist(userId);

  const items = await db
    .select({ symbol: assets.symbol })
    .from(watchlistItems)
    .innerJoin(assets, eq(assets.id, watchlistItems.assetId))
    .where(eq(watchlistItems.watchlistId, watchlist.id));

  return items.map((i) => i.symbol);
}
