import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, portfolios, portfolioTransactions } from "@/lib/db/schema";

/** Símbolos únicos entre todos los portafolios de un usuario. */
export async function getPortfolioSymbols(userId: string): Promise<string[]> {
  const userPortfolios = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(eq(portfolios.userId, userId));

  if (userPortfolios.length === 0) return [];

  const rows = await db
    .selectDistinct({ symbol: assets.symbol })
    .from(portfolioTransactions)
    .innerJoin(assets, eq(assets.id, portfolioTransactions.assetId))
    .where(
      inArray(
        portfolioTransactions.portfolioId,
        userPortfolios.map((p) => p.id),
      ),
    );

  return rows.map((r) => r.symbol);
}
