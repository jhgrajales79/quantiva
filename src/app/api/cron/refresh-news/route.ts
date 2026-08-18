import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, newsItems } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { newId } from "@/lib/id";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const provider = getMarketDataProvider();
  const trackedAssets = await db
    .select({ symbol: assets.symbol })
    .from(assets)
    .where(eq(assets.assetType, "stock"));

  let inserted = 0;
  const errors: string[] = [];

  for (const asset of trackedAssets) {
    try {
      const articles = await provider.getCompanyNews(asset.symbol);
      const fetchedAt = new Date();

      for (const article of articles) {
        const result = await db
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
          .onConflictDoNothing()
          .returning({ id: newsItems.id });
        if (result.length > 0) inserted += 1;
      }
    } catch (error) {
      errors.push(`${asset.symbol}: ${(error as Error).message}`);
    }
  }

  return NextResponse.json({ inserted, assetsChecked: trackedAssets.length, errors });
}
