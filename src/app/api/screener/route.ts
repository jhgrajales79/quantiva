import { NextResponse } from "next/server";
import { and, desc, eq, gte, lte, isNotNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, screenerSnapshots, valuationConsensus, ratios } from "@/lib/db/schema";
import { refreshMarketBreadth } from "@/lib/providers/refresh-market-breadth";
import { isStale } from "@/lib/cache";
import { SECTOR_LIST } from "@/lib/providers/sp500-sectors";

const SCREENER_TTL_MS = 6 * 60 * 60_000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const peMin = searchParams.get("peMin") ? Number(searchParams.get("peMin")) : null;
  const peMax = searchParams.get("peMax") ? Number(searchParams.get("peMax")) : null;
  const marketCapMin = searchParams.get("marketCapMin") ? Number(searchParams.get("marketCapMin")) : null;
  const dividendYieldMin = searchParams.get("dividendYieldMin")
    ? Number(searchParams.get("dividendYieldMin"))
    : null;
  const sector = searchParams.get("sector");
  const aboveMa50 = searchParams.get("aboveMa50") === "true";
  const aboveMa200 = searchParams.get("aboveMa200") === "true";
  const near52wHigh = searchParams.get("near52wHigh") === "true";

  let [latestRow] = await db
    .select({ date: screenerSnapshots.date, fetchedAt: screenerSnapshots.fetchedAt })
    .from(screenerSnapshots)
    .orderBy(desc(screenerSnapshots.date))
    .limit(1);

  if (isStale(latestRow?.fetchedAt, SCREENER_TTL_MS)) {
    try {
      await refreshMarketBreadth();
      [latestRow] = await db
        .select({ date: screenerSnapshots.date, fetchedAt: screenerSnapshots.fetchedAt })
        .from(screenerSnapshots)
        .orderBy(desc(screenerSnapshots.date))
        .limit(1);
    } catch (error) {
      if (!latestRow) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
    }
  }

  if (!latestRow) {
    return NextResponse.json({ results: [], sectors: SECTOR_LIST, date: null });
  }

  const conditions = [eq(screenerSnapshots.date, latestRow.date)];
  if (peMin !== null) conditions.push(gte(screenerSnapshots.pe, peMin));
  if (peMax !== null) conditions.push(lte(screenerSnapshots.pe, peMax));
  if (marketCapMin !== null) conditions.push(gte(screenerSnapshots.marketCap, marketCapMin));
  if (dividendYieldMin !== null) conditions.push(gte(screenerSnapshots.dividendYield, dividendYieldMin));
  if (sector) conditions.push(eq(screenerSnapshots.sector, sector));
  if (peMin !== null || peMax !== null) conditions.push(isNotNull(screenerSnapshots.pe));

  const rows = await db
    .select({
      symbol: assets.symbol,
      name: assets.name,
      sector: screenerSnapshots.sector,
      price: screenerSnapshots.price,
      changePct: screenerSnapshots.changePct,
      marketCap: screenerSnapshots.marketCap,
      pe: screenerSnapshots.pe,
      forwardPe: screenerSnapshots.forwardPe,
      pb: screenerSnapshots.pb,
      dividendYield: screenerSnapshots.dividendYield,
      ma50: screenerSnapshots.ma50,
      ma200: screenerSnapshots.ma200,
      fiftyTwoWeekLow: screenerSnapshots.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: screenerSnapshots.fiftyTwoWeekHigh,
      assetId: screenerSnapshots.assetId,
    })
    .from(screenerSnapshots)
    .innerJoin(assets, eq(assets.id, screenerSnapshots.assetId))
    .where(and(...conditions))
    .limit(500);

  let filtered = rows;
  if (aboveMa50) {
    filtered = filtered.filter((r) => r.price !== null && r.ma50 !== null && r.price > r.ma50);
  }
  if (aboveMa200) {
    filtered = filtered.filter((r) => r.price !== null && r.ma200 !== null && r.price > r.ma200);
  }
  if (near52wHigh) {
    filtered = filtered.filter(
      (r) =>
        r.price !== null &&
        r.fiftyTwoWeekHigh !== null &&
        r.price >= r.fiftyTwoWeekHigh * 0.95,
    );
  }

  // Cobertura parcial: solo para los activos que ya visitó algún usuario
  // (tienen ratios/valuationConsensus propios). Nunca se inventa para el
  // resto del universo.
  const assetIds = filtered.map((r) => r.assetId);
  const [ownRatios, ownConsensus] = await Promise.all([
    assetIds.length
      ? db.select().from(ratios).where(inArray(ratios.assetId, assetIds)).orderBy(ratios.fiscalDate)
      : Promise.resolve([]),
    assetIds.length
      ? db.select().from(valuationConsensus).where(inArray(valuationConsensus.assetId, assetIds))
      : Promise.resolve([]),
  ]);

  const ratiosByAsset = new Map(ownRatios.map((r) => [r.assetId, r]));
  const consensusByAsset = new Map(ownConsensus.map((c) => [c.assetId, c]));

  const results = filtered.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    sector: r.sector,
    price: r.price,
    changePct: r.changePct,
    marketCap: r.marketCap,
    pe: r.pe,
    forwardPe: r.forwardPe,
    pb: r.pb,
    dividendYield: r.dividendYield,
    roe: ratiosByAsset.get(r.assetId)?.roe ?? null,
    investmentScore: consensusByAsset.get(r.assetId)?.investmentScore ?? null,
    upsidePct: consensusByAsset.get(r.assetId)?.upsidePct ?? null,
    qualityCoverage: ratiosByAsset.has(r.assetId),
  }));

  return NextResponse.json({
    results,
    sectors: SECTOR_LIST,
    date: latestRow.date,
    universeSize: rows.length,
  });
}
