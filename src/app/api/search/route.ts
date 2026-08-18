import { NextResponse } from "next/server";
import { getMarketDataProvider } from "@/lib/providers/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const provider = getMarketDataProvider();
    const results = await provider.searchSymbols(query);
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
