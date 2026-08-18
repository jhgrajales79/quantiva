import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { newsItems } from "@/lib/db/schema";
import { getWatchlistSymbols } from "@/lib/watchlist";
import { ensureNewsForSymbol } from "@/lib/news";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const symbols = await getWatchlistSymbols(session.user.id);
  if (symbols.length === 0) {
    return NextResponse.json({ items: [] });
  }

  await Promise.all(
    symbols.map((symbol) => ensureNewsForSymbol(symbol).catch(() => null)),
  );

  const recent = await db
    .select()
    .from(newsItems)
    .orderBy(desc(newsItems.publishedAt))
    .limit(200);

  const symbolSet = new Set(symbols);
  const relevant = recent
    .filter((n) => n.relatedSymbols?.some((s) => symbolSet.has(s)))
    .slice(0, 10);

  return NextResponse.json({
    items: relevant.map((n) => ({
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
