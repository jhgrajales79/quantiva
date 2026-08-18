import { NextResponse } from "next/server";
import { getPeerSymbols } from "@/lib/providers/yahoo-stock-detail";
import { getMarketDataProvider } from "@/lib/providers/registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const peerSymbols = await getPeerSymbols(symbol);
    const provider = getMarketDataProvider();

    const peers = await Promise.all(
      peerSymbols.map(async (peerSymbol) => {
        const quote = await provider.getQuote(peerSymbol).catch(() => null);
        return {
          symbol: peerSymbol,
          price: quote?.price ?? null,
          changePct: quote?.changePct ?? null,
        };
      }),
    );

    return NextResponse.json({ symbol, peers, source: "Yahoo Finance" });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
