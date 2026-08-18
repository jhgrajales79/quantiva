import { db } from "@/lib/db/client";
import { newsItems } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, TTL } from "@/lib/cache";
import { newId } from "@/lib/id";
import { desc, sql } from "drizzle-orm";

/**
 * Refresca el cache de noticias para un símbolo si está vencido. Comparte
 * la lógica entre `/api/news` y `/api/news/watchlist` para no duplicarla.
 */
export async function ensureNewsForSymbol(symbol: string): Promise<void> {
  const [latest] = await db
    .select({ fetchedAt: newsItems.fetchedAt })
    .from(newsItems)
    .where(sql`${newsItems.relatedSymbols} @> ${JSON.stringify([symbol])}::jsonb`)
    .orderBy(desc(newsItems.fetchedAt))
    .limit(1);

  if (!isStale(latest?.fetchedAt, TTL.NEWS_MS)) return;

  const provider = getMarketDataProvider();
  const articles = await provider.getCompanyNews(symbol);
  const fetchedAt = new Date();

  for (const article of articles) {
    await db
      .insert(newsItems)
      .values({
        id: newId("news"),
        source: article.source,
        publishedAt: new Date(article.publishedAt),
        title: article.title,
        summary: article.summary,
        url: article.url,
        relatedSymbols: article.relatedSymbols,
        category: "company",
        fetchedAt,
      })
      .onConflictDoNothing();
  }
}
