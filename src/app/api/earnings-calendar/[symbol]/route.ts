import { NextResponse } from "next/server";
import { getUpcomingEarnings } from "@/lib/earnings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const result = await getUpcomingEarnings(symbol);
  if (!result) {
    return NextResponse.json({ symbol, error: "Dato no disponible" }, { status: 404 });
  }
  return NextResponse.json(result);
}
