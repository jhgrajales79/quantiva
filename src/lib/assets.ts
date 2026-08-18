import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function getOrCreateAsset(
  symbol: string,
  assetType: "stock" | "etf" | "crypto",
  name?: string,
): Promise<typeof assets.$inferSelect> {
  const normalized = symbol.toUpperCase();

  const [existing] = await db
    .select()
    .from(assets)
    .where(eq(assets.symbol, normalized))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(assets)
    .values({
      id: newId("asset"),
      symbol: normalized,
      name: name ?? normalized,
      assetType,
    })
    .returning();

  return created;
}

export async function getAssetBySymbol(symbol: string) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.symbol, symbol.toUpperCase()))
    .limit(1);
  return asset ?? null;
}
