import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fundamentals, macroIndicators, pricesIntradayCache, ratios } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { valueDcf } from "@/lib/valuation/dcf";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const { searchParams } = new URL(request.url);
  const growthOverride = searchParams.get("growth");
  const waccPremiumOverride = searchParams.get("equityRiskPremium");
  const terminalGrowthOverride = searchParams.get("terminalGrowth");
  const projectionYearsOverride = searchParams.get("years");

  const [fund] = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(desc(fundamentals.fiscalDate))
    .limit(1);

  if (!fund) {
    return NextResponse.json(
      { symbol, error: "Dato no disponible: primero consulta /api/fundamentals/" + symbol },
      { status: 404 },
    );
  }

  const [quote] = await db
    .select()
    .from(pricesIntradayCache)
    .where(eq(pricesIntradayCache.assetId, asset.id))
    .limit(1);

  const [latestRatio] = await db
    .select()
    .from(ratios)
    .where(eq(ratios.assetId, asset.id))
    .orderBy(desc(ratios.fiscalDate))
    .limit(1);

  const [treasury10y] = await db
    .select()
    .from(macroIndicators)
    .where(eq(macroIndicators.code, "DGS10"))
    .orderBy(desc(macroIndicators.date))
    .limit(1);

  const riskFreeRate = treasury10y ? treasury10y.value / 100 : null;

  const result = valueDcf({
    fcf: fund.fcf,
    revenueGrowth: growthOverride !== null ? Number(growthOverride) / 100 : latestRatio?.revenueGrowth ?? null,
    beta: fund.beta,
    totalDebt: fund.totalDebt,
    cash: fund.cash,
    sharesOutstanding: fund.sharesOutstanding,
    riskFreeRate,
    equityRiskPremium: waccPremiumOverride !== null ? Number(waccPremiumOverride) / 100 : undefined,
    terminalGrowth: terminalGrowthOverride !== null ? Number(terminalGrowthOverride) / 100 : undefined,
    projectionYears: projectionYearsOverride !== null ? Number(projectionYearsOverride) : undefined,
  });

  return NextResponse.json({
    symbol,
    currentPrice: quote?.price ?? null,
    fairValue: result.fairValue,
    upsidePct:
      result.fairValue !== null && quote?.price ? (result.fairValue - quote.price) / quote.price : null,
    unavailableReason: result.unavailableReason,
    assumptionsUsed: result.assumptions,
    inputs: {
      fcf: fund.fcf,
      beta: fund.beta,
      totalDebt: fund.totalDebt,
      cash: fund.cash,
      sharesOutstanding: fund.sharesOutstanding,
      riskFreeRate,
    },
  });
}
