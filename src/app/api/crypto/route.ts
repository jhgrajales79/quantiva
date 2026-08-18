import { NextResponse } from "next/server";
import { getCryptoDataProvider } from "@/lib/providers/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "15");

  try {
    const provider = getCryptoDataProvider();
    const coins = await provider.getTopByMarketCap(limit);
    return NextResponse.json({ coins, source: provider.name, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
