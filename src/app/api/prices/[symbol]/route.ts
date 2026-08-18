import { NextResponse } from "next/server";
import { getDailyPriceHistory } from "@/lib/prices";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const prices = await getDailyPriceHistory(symbol);
    return NextResponse.json({ symbol, prices });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
