import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { newsItems } from "@/lib/db/schema";
import { ensureNewsForSymbol } from "@/lib/news";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? null;

  if (symbol) {
    try {
      await ensureNewsForSymbol(symbol);
    } catch (error) {
      const [existing] = await db
        .select({ id: newsItems.id })
        .from(newsItems)
        .where(sql`${newsItems.relatedSymbols} @> ${JSON.stringify([symbol])}::jsonb`)
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
    }
  }

  const items = await db
    .select()
    .from(newsItems)
    .where(symbol ? sql`${newsItems.relatedSymbols} @> ${JSON.stringify([symbol])}::jsonb` : sql`true`)
    .orderBy(desc(newsItems.publishedAt))
    .limit(30);

  return NextResponse.json({
    items: items.map((n) => ({
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
