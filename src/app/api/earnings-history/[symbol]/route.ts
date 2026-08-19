import { NextResponse } from "next/server";
import { getEarningsHistory } from "@/lib/providers/yahoo-stock-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const history = await getEarningsHistory(symbol);
    return NextResponse.json({ symbol, history, source: "Yahoo Finance" });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
