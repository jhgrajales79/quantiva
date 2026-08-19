import { NextResponse } from "next/server";
import { getExtendedQuote } from "@/lib/providers/yahoo-extended-quote";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const quote = await getExtendedQuote(symbol);
    if (!quote) {
      return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
    }
    return NextResponse.json({ ...quote, symbol, source: "Yahoo Finance" });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
