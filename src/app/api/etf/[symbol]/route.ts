import { NextResponse } from "next/server";
import { getEtfProfile } from "@/lib/providers/yahoo-stock-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const profile = await getEtfProfile(symbol);
    if (!profile) {
      return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
    }
    return NextResponse.json({ symbol, ...profile, source: "Yahoo Finance" });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
