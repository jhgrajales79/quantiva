import { NextResponse } from "next/server";
import { getEarningsForecasts, FORECAST_PERIOD_LABELS } from "@/lib/providers/yahoo-stock-detail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  try {
    const forecasts = await getEarningsForecasts(symbol);
    return NextResponse.json({
      symbol,
      forecasts: forecasts.map((f) => ({ ...f, label: FORECAST_PERIOD_LABELS[f.period] ?? f.period })),
      source: "Yahoo Finance",
    });
  } catch (error) {
    return NextResponse.json({ symbol, error: (error as Error).message }, { status: 502 });
  }
}
