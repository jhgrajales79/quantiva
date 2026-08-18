import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  fundamentals,
  macroIndicators,
  pricesIntradayCache,
  ratios,
  valuationConsensus,
  valuations,
} from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { evaluateAsset } from "@/lib/valuation/evaluate";
import { computePerformance } from "@/lib/performance";
import { computeHistoricalComparison } from "@/lib/valuation/historical-comparison";
import { newId } from "@/lib/id";
import type { RatiosSnapshot } from "@/lib/valuation/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const [fund] = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(desc(fundamentals.fiscalDate))
    .limit(1);

  if (!fund) {
    return NextResponse.json(
      {
        symbol,
        error:
          "Dato no disponible: primero consulta /api/fundamentals/" +
          symbol +
          " para poblar los fundamentales.",
      },
      { status: 404 },
    );
  }

  const [quote] = await db
    .select()
    .from(pricesIntradayCache)
    .where(eq(pricesIntradayCache.assetId, asset.id))
    .limit(1);

  if (!quote) {
    return NextResponse.json(
      {
        symbol,
        error:
          "Dato no disponible: primero consulta /api/quotes/" + symbol + " para obtener el precio actual.",
      },
      { status: 404 },
    );
  }

  const historicalRatiosRows = await db
    .select()
    .from(ratios)
    .where(eq(ratios.assetId, asset.id))
    .orderBy(desc(ratios.fiscalDate))
    .limit(8);

  const historicalRatios: RatiosSnapshot[] = historicalRatiosRows.map((r) => ({
    fiscalDate: r.fiscalDate,
    pe: r.pe,
    ps: r.ps,
    evEbitda: r.evEbitda,
    revenueGrowth: r.revenueGrowth,
  }));

  const latestRatio = historicalRatiosRows[0] ?? null;

  const historicalFundamentalsRows = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(desc(fundamentals.fiscalDate))
    .limit(8);

  const fcfMargins = historicalFundamentalsRows.map((f) =>
    f.fcf !== null && f.revenue ? f.fcf / f.revenue : null,
  );
  const olderRatios = historicalRatiosRows.slice(1); // excluye el snapshot de hoy del promedio
  const olderFcfMargins = fcfMargins.slice(1);

  const historicalComparisons = {
    pe: computeHistoricalComparison(latestRatio?.pe ?? null, olderRatios.map((r) => r.pe)),
    evEbitda: computeHistoricalComparison(
      latestRatio?.evEbitda ?? null,
      olderRatios.map((r) => r.evEbitda),
    ),
    ps: computeHistoricalComparison(latestRatio?.ps ?? null, olderRatios.map((r) => r.ps)),
    pb: computeHistoricalComparison(latestRatio?.pb ?? null, olderRatios.map((r) => r.pb)),
    fcfYield: computeHistoricalComparison(
      latestRatio?.fcfYield ?? null,
      olderRatios.map((r) => r.fcfYield),
    ),
    roe: computeHistoricalComparison(latestRatio?.roe ?? null, olderRatios.map((r) => r.roe)),
    operatingMargin: computeHistoricalComparison(
      latestRatio?.operatingMargin ?? null,
      olderRatios.map((r) => r.operatingMargin),
    ),
    fcfMargin: computeHistoricalComparison(fcfMargins[0] ?? null, olderFcfMargins),
    roic: {
      current: null,
      average: null,
      sampleCount: 0,
      vsAveragePct: null,
      unavailable: true,
      reason: "Dato no disponible: Yahoo Finance no expone ROIC directamente.",
    },
  };

  const [treasury10y] = await db
    .select()
    .from(macroIndicators)
    .where(eq(macroIndicators.code, "DGS10"))
    .orderBy(desc(macroIndicators.date))
    .limit(1);

  const riskFreeRate = treasury10y ? treasury10y.value / 100 : null;

  const performance = await computePerformance(asset.id);

  const result = evaluateAsset({
    currentPrice: quote.price,
    eps: fund.eps,
    revenue: fund.revenue,
    ebitda: fund.ebitda,
    fcf: fund.fcf,
    totalDebt: fund.totalDebt,
    cash: fund.cash,
    sharesOutstanding: fund.sharesOutstanding,
    bookValuePerShare: fund.bookValuePerShare,
    beta: fund.beta,
    revenueGrowth: latestRatio?.revenueGrowth ?? null,
    epsGrowth: latestRatio?.epsGrowth ?? null,
    roe: latestRatio?.roe ?? null,
    roic: latestRatio?.roic ?? null,
    grossMargin: latestRatio?.grossMargin ?? null,
    operatingMargin: latestRatio?.operatingMargin ?? null,
    debtToEbitda: latestRatio?.debtToEbitda ?? null,
    fcfYield: latestRatio?.fcfYield ?? null,
    dividendYield: latestRatio?.dividendYield ?? null,
    riskFreeRate,
    historicalRatios,
    performance,
  });

  const calculatedAt = new Date();

  for (const model of result.models) {
    await db
      .insert(valuations)
      .values({
        id: newId("val"),
        assetId: asset.id,
        model: model.model,
        fairValue: model.fairValue,
        assumptions: { ...model.assumptions, unavailableReason: model.unavailableReason },
        calculatedAt,
      })
      .onConflictDoUpdate({
        target: [valuations.assetId, valuations.model],
        set: {
          fairValue: model.fairValue,
          assumptions: { ...model.assumptions, unavailableReason: model.unavailableReason },
          calculatedAt,
        },
      });
  }

  await db
    .insert(valuationConsensus)
    .values({
      assetId: asset.id,
      fairValueConsensus: result.fairValueConsensus,
      upsidePct: result.upsidePct,
      marginOfSafetyPrice: result.marginOfSafetyPrice,
      valueScore: result.valueScore,
      qualityScore: result.qualityScore,
      growthScore: result.growthScore,
      momentumScore: result.momentumScore,
      investmentScore: result.investmentScore,
      possibleValueTrap: result.possibleValueTrap ? "yes" : "no",
      calculatedAt,
    })
    .onConflictDoUpdate({
      target: valuationConsensus.assetId,
      set: {
        fairValueConsensus: result.fairValueConsensus,
        upsidePct: result.upsidePct,
        marginOfSafetyPrice: result.marginOfSafetyPrice,
        valueScore: result.valueScore,
        qualityScore: result.qualityScore,
        growthScore: result.growthScore,
        momentumScore: result.momentumScore,
        investmentScore: result.investmentScore,
        possibleValueTrap: result.possibleValueTrap ? "yes" : "no",
        calculatedAt,
      },
    });

  return NextResponse.json({
    symbol,
    currentPrice: quote.price,
    fairValueConsensus: result.fairValueConsensus,
    upsidePct: result.upsidePct,
    marginOfSafetyPrice: result.marginOfSafetyPrice,
    badge: result.badge,
    scores: {
      value: result.valueScore,
      quality: result.qualityScore,
      growth: result.growthScore,
      momentum: result.momentumScore,
      investment: result.investmentScore,
    },
    possibleValueTrap: result.possibleValueTrap,
    historicalComparisons,
    models: result.models.map((m) => ({
      model: m.model,
      fairValue: m.fairValue,
      assumptions: m.assumptions,
      unavailableReason: m.unavailableReason,
    })),
    calculatedAt: calculatedAt.toISOString(),
  });
}
