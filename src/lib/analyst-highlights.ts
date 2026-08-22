import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { analystRatingChanges, assets } from "@/lib/db/schema";
import { getOrCreateAsset, TickerNotFoundError } from "@/lib/assets";
import { getAnalystData } from "@/lib/providers/yahoo-stock-detail";
import { isStale, TTL } from "@/lib/cache";
import { newId } from "@/lib/id";

// Universo de respaldo cuando la watchlist del usuario no tiene cambios de
// calificación recientes (o está vacía) — mega caps con cobertura de
// analistas casi garantizada, para que el widget nunca se vea vacío.
const MEGA_CAP_FALLBACK_SYMBOLS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "AVGO",
  "JPM",
  "NFLX",
];

export interface AnalystHighlight {
  symbol: string;
  name: string | null;
  date: string;
  firm: string;
  action: string;
  fromGrade: string | null;
  toGrade: string;
  priceTarget: number | null;
}

/**
 * Refresca el caché de cambios de calificación para `symbol` si está viejo
 * (o nunca se pobló) — best-effort: si Yahoo falla para un símbolo puntual
 * (sin cobertura de analistas, rate limit, etc.), no debe romper el resto
 * del universo consultado.
 */
async function ensureAnalystChangesCached(symbol: string): Promise<void> {
  let asset;
  try {
    asset = await getOrCreateAsset(symbol, "stock");
  } catch (error) {
    if (error instanceof TickerNotFoundError) return;
    throw error;
  }

  const [latest] = await db
    .select({ fetchedAt: analystRatingChanges.fetchedAt })
    .from(analystRatingChanges)
    .where(eq(analystRatingChanges.assetId, asset.id))
    .orderBy(desc(analystRatingChanges.fetchedAt))
    .limit(1);

  if (!isStale(latest?.fetchedAt, TTL.ANALYST_CHANGES_MS)) return;

  try {
    const data = await getAnalystData(symbol);
    for (const change of data.recentChanges) {
      await db
        .insert(analystRatingChanges)
        .values({
          id: newId("analystchg"),
          assetId: asset.id,
          date: change.date,
          firm: change.firm,
          action: change.action,
          fromGrade: change.fromGrade,
          toGrade: change.toGrade,
          priceTarget: change.priceTarget,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [analystRatingChanges.assetId, analystRatingChanges.date, analystRatingChanges.firm],
          set: {
            action: change.action,
            fromGrade: change.fromGrade,
            toGrade: change.toGrade,
            priceTarget: change.priceTarget,
            fetchedAt: new Date(),
          },
        });
    }
    if (data.recentChanges.length === 0) {
      // Sin historial de cambios para este símbolo (cobertura de analistas
      // limitada) — se marca igual como "consultado hace poco" insertando
      // un registro centinela no visible (fecha vacía se filtra al leer),
      // para no reintentar en cada carga del panel dentro del TTL.
      await db
        .insert(analystRatingChanges)
        .values({
          id: newId("analystchg"),
          assetId: asset.id,
          date: "",
          firm: "__none__",
          action: "none",
          fromGrade: null,
          toGrade: "",
          priceTarget: null,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [analystRatingChanges.assetId, analystRatingChanges.date, analystRatingChanges.firm],
          set: { fetchedAt: new Date() },
        });
    }
  } catch {
    // si falla el refresh, se sigue con lo que ya hubiera cacheado (puede
    // ser nada, si nunca se logró obtener este símbolo)
  }
}

async function getRecentChangesForSymbols(
  symbols: string[],
  limit: number,
  usedSymbols: Set<string>,
): Promise<AnalystHighlight[]> {
  if (symbols.length === 0) return [];

  const assetRows = await db
    .select({ id: assets.id, symbol: assets.symbol, name: assets.name })
    .from(assets)
    .where(inArray(assets.symbol, symbols));

  if (assetRows.length === 0) return [];

  const assetById = new Map(assetRows.map((a) => [a.id, a]));

  const changes = await db
    .select()
    .from(analystRatingChanges)
    .where(inArray(analystRatingChanges.assetId, assetRows.map((a) => a.id)))
    .orderBy(desc(analystRatingChanges.date));

  // Un solo cambio por ticker (el más reciente) — Yahoo puede reportar varias
  // firmas el mismo día para un mismo activo, y mostrar 3 tarjetas del mismo
  // ticker no aporta la variedad que el widget necesita.
  const results: AnalystHighlight[] = [];
  for (const change of changes) {
    if (change.firm === "__none__" || change.date === "") continue;
    const asset = assetById.get(change.assetId);
    if (!asset) continue;
    if (usedSymbols.has(asset.symbol)) continue;
    usedSymbols.add(asset.symbol);
    results.push({
      symbol: asset.symbol,
      name: asset.name,
      date: change.date,
      firm: change.firm,
      action: change.action,
      fromGrade: change.fromGrade,
      toGrade: change.toGrade,
      priceTarget: change.priceTarget,
    });
    if (results.length >= limit) break;
  }
  return results;
}

/**
 * Los `limit` cambios de calificación más recientes, uno por ticker distinto
 * (nunca repite símbolo entre las tarjetas), priorizando la watchlist del
 * usuario y completando con mega caps si no hay suficientes ahí — nunca se
 * mezclan al azar, la watchlist siempre gana el desempate.
 */
export async function getAnalystHighlights(
  watchlistSymbols: string[],
  limit = 3,
): Promise<AnalystHighlight[]> {
  const seen = new Set<string>();

  await Promise.all(watchlistSymbols.map((s) => ensureAnalystChangesCached(s)));
  const fromWatchlist = await getRecentChangesForSymbols(watchlistSymbols, limit, seen);

  if (fromWatchlist.length >= limit) return fromWatchlist;

  await Promise.all(MEGA_CAP_FALLBACK_SYMBOLS.map((s) => ensureAnalystChangesCached(s)));
  const fromFallback = await getRecentChangesForSymbols(
    MEGA_CAP_FALLBACK_SYMBOLS,
    limit - fromWatchlist.length,
    seen,
  );

  return [...fromWatchlist, ...fromFallback];
}
