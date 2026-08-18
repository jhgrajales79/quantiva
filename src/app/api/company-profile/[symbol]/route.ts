import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { companyProfiles } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getCompanyProfile, getFirstTradeDate } from "@/lib/providers/yahoo-stock-detail";
import { isStale } from "@/lib/cache";

const PROFILE_TTL_MS = 7 * 24 * 60 * 60_000; // un perfil de empresa no cambia seguido

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const asset = await getOrCreateAsset(symbol, "stock");

  const [cached] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.assetId, asset.id))
    .limit(1);

  if (isStale(cached?.fetchedAt, PROFILE_TTL_MS)) {
    try {
      const firstTradeDate = await getFirstTradeDate(symbol);
      const profile = await getCompanyProfile(symbol, firstTradeDate);

      if (profile) {
        await db
          .insert(companyProfiles)
          .values({
            assetId: asset.id,
            sector: profile.sector,
            industry: profile.industry,
            ceoName: profile.ceoName,
            employees: profile.employees,
            website: profile.website,
            businessSummary: profile.businessSummary,
            firstTradeDate: profile.firstTradeDate,
            source: "Yahoo Finance",
            fetchedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: companyProfiles.assetId,
            set: {
              sector: profile.sector,
              industry: profile.industry,
              ceoName: profile.ceoName,
              employees: profile.employees,
              website: profile.website,
              businessSummary: profile.businessSummary,
              firstTradeDate: profile.firstTradeDate,
              fetchedAt: new Date(),
            },
          });
      }
    } catch (error) {
      if (!cached) {
        return NextResponse.json({ error: (error as Error).message }, { status: 502 });
      }
    }
  }

  const [current] = await db
    .select()
    .from(companyProfiles)
    .where(eq(companyProfiles.assetId, asset.id))
    .limit(1);

  if (!current) {
    return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
  }

  return NextResponse.json({
    symbol,
    sector: current.sector,
    industry: current.industry,
    ceoName: current.ceoName,
    employees: current.employees,
    website: current.website,
    businessSummary: current.businessSummary,
    firstTradeDate: current.firstTradeDate,
    source: current.source,
    fetchedAt: current.fetchedAt.toISOString(),
  });
}
