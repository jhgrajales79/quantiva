import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { valuationConsensus, valuations } from "@/lib/db/schema";
import { getAssetBySymbol } from "@/lib/assets";

const RELATIVE_MODELS = ["pe_relative", "ev_ebitda", "ps"] as const;

/**
 * Lectura rápida del último consenso de Fair Value ya calculado, sin volver a
 * ejecutar el motor de valoración. Útil para tablas con muchas filas
 * (Watchlist, Screener) donde recalcular por fila sería costoso. Si nunca se
 * ha calculado para este símbolo, retorna null explícito (no se infiere).
 *
 * Además del consenso combinado, expone dos lecturas puras ya calculadas:
 * - intrinsicValue: solo el modelo DCF (valor intrínseco, basado en flujos
 *   de caja descontados, no en comparación con otras empresas).
 * - relativeValue: promedio simple de los modelos de múltiplos relativos
 *   (P/E, EV/EBITDA, P/S) que tengan dato disponible — análisis de valor
 *   justo basado en cómo el mercado valora al propio activo históricamente,
 *   sin mezclarlo con DCF ni Graham.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const asset = await getAssetBySymbol(symbol);
  if (!asset) {
    return NextResponse.json({ symbol, consensus: null, intrinsicValue: null, relativeValue: null });
  }

  const [consensus] = await db
    .select()
    .from(valuationConsensus)
    .where(eq(valuationConsensus.assetId, asset.id))
    .limit(1);

  const modelRows = await db
    .select({ model: valuations.model, fairValue: valuations.fairValue })
    .from(valuations)
    .where(eq(valuations.assetId, asset.id));

  const dcfRow = modelRows.find((r) => r.model === "dcf");
  const intrinsicValue = dcfRow?.fairValue ?? null;

  const relativeFairValues = modelRows
    .filter((r) => RELATIVE_MODELS.includes(r.model as (typeof RELATIVE_MODELS)[number]))
    .map((r) => r.fairValue)
    .filter((v): v is number => v !== null);
  const relativeValue =
    relativeFairValues.length > 0
      ? relativeFairValues.reduce((sum, v) => sum + v, 0) / relativeFairValues.length
      : null;

  if (!consensus) {
    return NextResponse.json({ symbol, consensus: null, intrinsicValue, relativeValue });
  }

  return NextResponse.json({
    symbol,
    consensus: {
      fairValueConsensus: consensus.fairValueConsensus,
      upsidePct: consensus.upsidePct,
      investmentScore: consensus.investmentScore,
      possibleValueTrap: consensus.possibleValueTrap === "yes",
      calculatedAt: consensus.calculatedAt.toISOString(),
    },
    intrinsicValue,
    relativeValue,
  });
}
