import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fundamentals, ratios } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { getAnnualFinancialsHistory } from "@/lib/providers/yahoo-financials-history";
import { isStale, TTL } from "@/lib/cache";
import { newId } from "@/lib/id";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const [latestFundamentals] = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(desc(fundamentals.fiscalDate))
    .limit(1);

  if (isStale(latestFundamentals?.fetchedAt, TTL.FUNDAMENTALS_MS)) {
    try {
      const provider = getMarketDataProvider();
      const [freshFundamentals, ratiosHistory] = await Promise.all([
        provider.getFundamentals(symbol),
        provider.getRatiosHistory(symbol, 8),
      ]);

      if (freshFundamentals) {
        await db
          .insert(fundamentals)
          .values({
            id: newId("fund"),
            assetId: asset.id,
            period: "annual",
            fiscalDate: freshFundamentals.fiscalDate,
            revenue: freshFundamentals.revenue,
            ebitda: freshFundamentals.ebitda,
            ebit: freshFundamentals.ebit,
            netIncome: freshFundamentals.netIncome,
            eps: freshFundamentals.eps,
            fcf: freshFundamentals.fcf,
            totalDebt: freshFundamentals.totalDebt,
            cash: freshFundamentals.cash,
            sharesOutstanding: freshFundamentals.sharesOutstanding,
            bookValuePerShare: freshFundamentals.bookValuePerShare,
            beta: freshFundamentals.beta,
            source: freshFundamentals.source,
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [fundamentals.assetId, fundamentals.period, fundamentals.fiscalDate],
            set: {
              revenue: freshFundamentals.revenue,
              ebitda: freshFundamentals.ebitda,
              ebit: freshFundamentals.ebit,
              netIncome: freshFundamentals.netIncome,
              eps: freshFundamentals.eps,
              fcf: freshFundamentals.fcf,
              totalDebt: freshFundamentals.totalDebt,
              cash: freshFundamentals.cash,
              sharesOutstanding: freshFundamentals.sharesOutstanding,
              bookValuePerShare: freshFundamentals.bookValuePerShare,
              beta: freshFundamentals.beta,
              fetchedAt: new Date(),
            },
          });
      }

      // Historia anual real (~4 años) vía Yahoo fundamentals-timeseries —
      // complementa el único snapshot TTM de arriba, para que las tendencias
      // (CAGR, gráficos históricos) no dependan de que la app acumule su
      // propio historial visita a visita.
      try {
        const annualHistory = await getAnnualFinancialsHistory(symbol);
        for (const point of annualHistory) {
          if (point.revenue === null && point.netIncome === null && point.eps === null && point.fcf === null) {
            continue;
          }
          await db
            .insert(fundamentals)
            .values({
              id: newId("fund"),
              assetId: asset.id,
              period: "annual",
              fiscalDate: point.fiscalDate,
              revenue: point.revenue,
              netIncome: point.netIncome,
              eps: point.eps,
              fcf: point.fcf,
              source: "Yahoo Finance (fundamentals-timeseries)",
              fetchedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [fundamentals.assetId, fundamentals.period, fundamentals.fiscalDate],
              set: {
                // Solo se completan estos 4 campos; no se pisan ebitda/ebit/deuda/etc.
                // si ya existían de otra fuente para la misma fecha.
                revenue: point.revenue,
                netIncome: point.netIncome,
                eps: point.eps,
                fcf: point.fcf,
                fetchedAt: new Date(),
              },
            });
        }
      } catch {
        // best-effort: si falla, se sigue mostrando el único snapshot TTM
      }

      for (const r of ratiosHistory) {
        await db
          .insert(ratios)
          .values({
            id: newId("ratio"),
            assetId: asset.id,
            period: r.period,
            fiscalDate: r.fiscalDate,
            pe: r.pe,
            forwardPe: r.forwardPe,
            ps: r.ps,
            pb: r.pb,
            evEbitda: r.evEbitda,
            fcfYield: r.fcfYield,
            dividendYield: r.dividendYield,
            roe: r.roe,
            roic: r.roic,
            grossMargin: r.grossMargin,
            operatingMargin: r.operatingMargin,
            debtToEbitda: r.debtToEbitda,
            revenueGrowth: freshFundamentals?.revenueGrowth ?? null,
            epsGrowth: freshFundamentals?.epsGrowth ?? null,
            source: r.source,
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [ratios.assetId, ratios.period, ratios.fiscalDate],
            set: {
              pe: r.pe,
              ps: r.ps,
              pb: r.pb,
              evEbitda: r.evEbitda,
              fcfYield: r.fcfYield,
              dividendYield: r.dividendYield,
              roe: r.roe,
              roic: r.roic,
              grossMargin: r.grossMargin,
              operatingMargin: r.operatingMargin,
              debtToEbitda: r.debtToEbitda,
              fetchedAt: new Date(),
            },
          });
      }
    } catch (error) {
      if (!latestFundamentals) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
      // si falla el refresh pero ya había datos cacheados, se sirven esos
    }
  }

  const [fund] = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(desc(fundamentals.fiscalDate))
    .limit(1);

  const [latestRatio] = await db
    .select()
    .from(ratios)
    .where(eq(ratios.assetId, asset.id))
    .orderBy(desc(ratios.fiscalDate))
    .limit(1);

  if (!fund) {
    return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
  }

  const historyRows = await db
    .select()
    .from(fundamentals)
    .where(and(eq(fundamentals.assetId, asset.id), eq(fundamentals.period, "annual")))
    .orderBy(fundamentals.fiscalDate)
    .limit(8);

  return NextResponse.json({
    symbol,
    fundamentals: {
      fiscalDate: fund.fiscalDate,
      revenue: fund.revenue,
      ebitda: fund.ebitda,
      ebit: fund.ebit,
      netIncome: fund.netIncome,
      eps: fund.eps,
      fcf: fund.fcf,
      totalDebt: fund.totalDebt,
      cash: fund.cash,
      sharesOutstanding: fund.sharesOutstanding,
      bookValuePerShare: fund.bookValuePerShare,
      beta: fund.beta,
      source: fund.source,
      fetchedAt: fund.fetchedAt.toISOString(),
    },
    ratios: latestRatio
      ? {
          fiscalDate: latestRatio.fiscalDate,
          pe: latestRatio.pe,
          ps: latestRatio.ps,
          pb: latestRatio.pb,
          evEbitda: latestRatio.evEbitda,
          fcfYield: latestRatio.fcfYield,
          dividendYield: latestRatio.dividendYield,
          roe: latestRatio.roe,
          roic: latestRatio.roic,
          grossMargin: latestRatio.grossMargin,
          operatingMargin: latestRatio.operatingMargin,
          debtToEbitda: latestRatio.debtToEbitda,
          revenueGrowth: latestRatio.revenueGrowth,
          epsGrowth: latestRatio.epsGrowth,
          source: latestRatio.source,
          fetchedAt: latestRatio.fetchedAt.toISOString(),
        }
      : null,
    history: historyRows.map((h) => ({
      fiscalDate: h.fiscalDate,
      revenue: h.revenue,
      netIncome: h.netIncome,
      eps: h.eps,
      fcf: h.fcf,
    })),
  });
}
