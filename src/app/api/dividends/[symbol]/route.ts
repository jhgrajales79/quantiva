import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { dividends } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { computeDpsTtm, computeDividendCagr } from "@/lib/dividends";
import { isStale } from "@/lib/cache";
import { newId } from "@/lib/id";

const DIVIDENDS_TTL_MS = 24 * 60 * 60_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  let history = await db
    .select()
    .from(dividends)
    .where(eq(dividends.assetId, asset.id))
    .orderBy(desc(dividends.exDate));

  if (isStale(history[0]?.fetchedAt, DIVIDENDS_TTL_MS)) {
    try {
      const provider = getMarketDataProvider();
      const fresh = await provider.getDividends(symbol);
      const fetchedAt = new Date();

      if (fresh.length > 0) {
        await db
          .insert(dividends)
          .values(
            fresh.map((d) => ({
              id: newId("div"),
              assetId: asset.id,
              exDate: d.exDate,
              paymentDate: d.paymentDate,
              recordDate: d.recordDate,
              amount: d.amount,
              frequency: d.frequency,
              source: provider.name,
              fetchedAt,
            })),
          )
          .onConflictDoNothing();
      }

      history = await db
        .select()
        .from(dividends)
        .where(eq(dividends.assetId, asset.id))
        .orderBy(desc(dividends.exDate));
    } catch {
      // si falla el refresh, se sirve lo que ya hubiera en cache (puede ser
      // vacío si la empresa no paga dividendos o nunca se logró obtener)
    }
  }

  if (history.length === 0) {
    return NextResponse.json({
      symbol,
      dpsTtm: null,
      cagr5y: null,
      cagr10y: null,
      history: [],
    });
  }

  const points = history.map((d) => ({ exDate: d.exDate, amount: d.amount }));

  return NextResponse.json({
    symbol,
    dpsTtm: computeDpsTtm(points),
    cagr5y: computeDividendCagr(points, 5),
    cagr10y: computeDividendCagr(points, 10),
    history: history.slice(0, 12).map((d) => ({
      exDate: d.exDate,
      paymentDate: d.paymentDate,
      amount: d.amount,
      frequency: d.frequency,
    })),
    source: history[0].source,
    fetchedAt: history[0].fetchedAt.toISOString(),
  });
}
