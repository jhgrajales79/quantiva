import { NextResponse } from "next/server";

async function fetchJson(url: string, cookie: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { cookie }, cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const origin = new URL(request.url).origin;
  const cookie = request.headers.get("cookie") ?? "";

  const [valuation, analysts, simulator, fundamentalsRes, earningsHistory, forecasts, shareholders, secFilings, dividendsRes] =
    await Promise.all([
      fetchJson(`${origin}/api/valuation/${symbol}`, cookie),
      fetchJson(`${origin}/api/analysts/${symbol}`, cookie),
      fetchJson(`${origin}/api/dcf-simulator/${symbol}`, cookie),
      fetchJson(`${origin}/api/fundamentals/${symbol}`, cookie),
      fetchJson(`${origin}/api/earnings-history/${symbol}`, cookie),
      fetchJson(`${origin}/api/forecasts/${symbol}`, cookie),
      fetchJson(`${origin}/api/shareholders/${symbol}`, cookie),
      fetchJson(`${origin}/api/sec-filings/${symbol}`, cookie),
      fetchJson(`${origin}/api/dividends/${symbol}`, cookie),
    ]);

  const latestEarnings = earningsHistory?.history?.length ? earningsHistory.history[earningsHistory.history.length - 1] : null;
  const nextForecast = forecasts?.forecasts?.[0] ?? null;
  const latestFiling = secFilings?.filings?.[0] ?? null;

  return NextResponse.json({
    symbol,
    fairValue: {
      value: valuation?.fairValueConsensus ?? null,
      upsidePct: valuation?.upsidePct ?? null,
    },
    analystTarget: {
      targetMeanPrice: analysts?.targetMeanPrice ?? null,
      numberOfAnalysts: analysts?.numberOfAnalysts ?? null,
    },
    simulator: {
      fairValue: simulator?.fairValue ?? null,
      upsidePct: simulator?.upsidePct ?? null,
    },
    finanzas: {
      revenue: fundamentalsRes?.fundamentals?.revenue ?? null,
      fiscalDate: fundamentalsRes?.fundamentals?.fiscalDate ?? null,
    },
    earnings: {
      epsActual: latestEarnings?.epsActual ?? null,
      epsEstimate: latestEarnings?.epsEstimate ?? null,
      surprisePercent: latestEarnings?.surprisePercent ?? null,
      quarterEndDate: latestEarnings?.quarterEndDate ?? null,
    },
    previsiones: {
      label: nextForecast?.label ?? null,
      epsEstimateAvg: nextForecast?.epsEstimateAvg ?? null,
      epsGrowth: nextForecast?.epsGrowth ?? null,
    },
    dividendos: {
      dpsTtm: dividendsRes?.dpsTtm ?? null,
      dividendYield: fundamentalsRes?.ratios?.dividendYield ?? null,
    },
    accionistas: {
      institutionsPct: shareholders?.institutionsPct ?? null,
      insidersPct: shareholders?.insidersPct ?? null,
    },
    reportesSec: {
      type: latestFiling?.type ?? null,
      date: latestFiling?.date ?? null,
    },
  });
}
