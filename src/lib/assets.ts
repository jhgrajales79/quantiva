import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { getMarketDataProvider } from "@/lib/providers/registry";

export class TickerNotFoundError extends Error {
  constructor(symbol: string) {
    super(`Ticker no encontrado: ${symbol}`);
    this.name = "TickerNotFoundError";
  }
}

export async function getOrCreateAsset(
  symbol: string,
  assetType: "stock" | "etf" | "crypto",
  options?: { name?: string; skipLiveValidation?: boolean },
): Promise<typeof assets.$inferSelect> {
  const normalized = symbol.toUpperCase();

  const [existing] = await db
    .select()
    .from(assets)
    .where(eq(assets.symbol, normalized))
    .limit(1);

  if (existing) return existing;

  // Símbolo nunca antes visto: se valida en tiempo real contra el proveedor
  // de datos (Yahoo Finance) antes de persistirlo, para no crear un activo
  // "fantasma" a partir de un ticker mal escrito o inexistente. Las cargas
  // masivas que ya validaron el símbolo momentos antes (movers, screener)
  // pueden saltarse esta doble verificación con skipLiveValidation.
  let resolvedName = options?.name ?? normalized;
  if (!options?.skipLiveValidation) {
    const provider = getMarketDataProvider();
    const quote = await provider.getQuote(normalized);
    if (!quote) {
      throw new TickerNotFoundError(normalized);
    }
    resolvedName = quote.companyName ?? resolvedName;
  }

  const [created] = await db
    .insert(assets)
    .values({
      id: newId("asset"),
      symbol: normalized,
      name: resolvedName,
      assetType,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  // Carrera entre dos requests concurrentes creando el mismo símbolo nuevo:
  // la segunda pierde el insert (onConflictDoNothing) pero el activo ya
  // existe, así que se recupera en vez de fallar.
  const [race] = await db.select().from(assets).where(eq(assets.symbol, normalized)).limit(1);
  return race;
}

export async function getAssetBySymbol(symbol: string) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.symbol, symbol.toUpperCase()))
    .limit(1);
  return asset ?? null;
}
