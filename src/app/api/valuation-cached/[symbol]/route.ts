import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { valuationConsensus } from "@/lib/db/schema";
import { getAssetBySymbol } from "@/lib/assets";

/**
 * Lectura rápida del último consenso de Fair Value ya calculado, sin volver a
 * ejecutar el motor de valoración. Útil para tablas con muchas filas
 * (Watchlist, Screener) donde recalcular por fila sería costoso. Si nunca se
 * ha calculado para este símbolo, retorna null explícito (no se infiere).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const asset = await getAssetBySymbol(symbol);
  if (!asset) {
    return NextResponse.json({ symbol, consensus: null });
  }

  const [consensus] = await db
    .select()
    .from(valuationConsensus)
    .where(eq(valuationConsensus.assetId, asset.id))
    .limit(1);

  if (!consensus) {
    return NextResponse.json({ symbol, consensus: null });
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
  });
}
