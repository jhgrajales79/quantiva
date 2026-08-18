import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { newsItems } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isStale, TTL } from "@/lib/cache";
import { newId } from "@/lib/id";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? null;

  const existing = await db
    .select()
    .from(newsItems)
    .where(
      symbol
        ? sql`${newsItems.relatedSymbols} @> ${JSON.stringify([symbol])}::jsonb`
        : sql`true`,
    )
    .orderBy(desc(newsItems.publishedAt))
    .limit(30);

  if (isStale(existing[0]?.fetchedAt, TTL.NEWS_MS) && symbol) {
    try {
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
    } catch (error) {
      if (existing.length === 0) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
    }
  }

  const refreshed = await db
    .select()
    .from(newsItems)
    .where(
      symbol
        ? sql`${newsItems.relatedSymbols} @> ${JSON.stringify([symbol])}::jsonb`
        : sql`true`,
    )
    .orderBy(desc(newsItems.publishedAt))
    .limit(30);

  return NextResponse.json({
    items: refreshed.map((n) => ({
      id: n.id,
      source: n.source,
      publishedAt: n.publishedAt.toISOString(),
      title: n.title,
      summary: n.summary,
      url: n.url,
      relatedSymbols: n.relatedSymbols,
      category: n.category,
      fetchedAt: n.fetchedAt.toISOString(),
    })),
  });
}
