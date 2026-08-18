import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, fundamentals, ratios } from "@/lib/db/schema";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { newId } from "@/lib/id";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const provider = getMarketDataProvider();
  const trackedAssets = await db
    .select({ id: assets.id, symbol: assets.symbol })
    .from(assets)
    .where(eq(assets.assetType, "stock"));

  let updated = 0;
  const errors: string[] = [];

  for (const asset of trackedAssets) {
    try {
      const [fund, ratiosHistory] = await Promise.all([
        provider.getFundamentals(asset.symbol),
        provider.getRatiosHistory(asset.symbol, 8),
      ]);

      if (fund) {
        await db
          .insert(fundamentals)
          .values({
            id: newId("fund"),
            assetId: asset.id,
            period: "annual",
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
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [fundamentals.assetId, fundamentals.period, fundamentals.fiscalDate],
            set: {
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
              fetchedAt: new Date(),
            },
          });
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
            revenueGrowth: fund?.revenueGrowth ?? null,
            epsGrowth: fund?.epsGrowth ?? null,
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

      updated += 1;
    } catch (error) {
      errors.push(`${asset.symbol}: ${(error as Error).message}`);
    }
  }

  return NextResponse.json({ updated, total: trackedAssets.length, errors });
}
