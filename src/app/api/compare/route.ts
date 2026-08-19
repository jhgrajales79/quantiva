import { NextResponse } from "next/server";

const MAX_SYMBOLS = 5;

interface CompareEntry {
  symbol: string;
  error: string | null;
  companyName: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  pe: number | null;
  ps: number | null;
  pb: number | null;
  evEbitda: number | null;
  dividendYield: number | null;
  roe: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  fairValueConsensus: number | null;
  upsidePct: number | null;
  investmentScore: number | null;
  valueScore: number | null;
  qualityScore: number | null;
  growthScore: number | null;
  momentumScore: number | null;
}

async function fetchJson(origin: string, path: string, cookie: string) {
  try {
    const res = await fetch(`${origin}${path}`, { cache: "no-store", headers: { cookie } });
    const body = await res.json().catch(() => null);
    return res.ok ? body : null;
  } catch {
    return null;
  }
}

async function compareSymbol(origin: string, symbol: string, cookie: string): Promise<CompareEntry> {
  const [quote, fundamentals] = await Promise.all([
    fetchJson(origin, `/api/quotes/${symbol}`, cookie),
    fetchJson(origin, `/api/fundamentals/${symbol}`, cookie),
  ]);

  if (!quote || !fundamentals) {
    return {
      symbol,
      error: "Dato no disponible",
      companyName: null,
      price: null,
      changePct: null,
      marketCap: null,
      fiftyTwoWeekLow: null,
      fiftyTwoWeekHigh: null,
      pe: null,
      ps: null,
      pb: null,
      evEbitda: null,
      dividendYield: null,
      roe: null,
      grossMargin: null,
      operatingMargin: null,
      revenueGrowth: null,
      epsGrowth: null,
      fairValueConsensus: null,
      upsidePct: null,
      investmentScore: null,
      valueScore: null,
      qualityScore: null,
      growthScore: null,
      momentumScore: null,
    };
  }

  const valuation = await fetchJson(origin, `/api/valuation/${symbol}`, cookie);
  const r = fundamentals.ratios;

  return {
    symbol,
    error: null,
    companyName: quote.companyName ?? null,
    price: quote.price ?? null,
    changePct: quote.changePct ?? null,
    marketCap: quote.marketCap ?? null,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
    pe: r?.pe ?? null,
    ps: r?.ps ?? null,
    pb: r?.pb ?? null,
    evEbitda: r?.evEbitda ?? null,
    dividendYield: r?.dividendYield ?? null,
    roe: r?.roe ?? null,
    grossMargin: r?.grossMargin ?? null,
    operatingMargin: r?.operatingMargin ?? null,
    revenueGrowth: r?.revenueGrowth ?? null,
    epsGrowth: r?.epsGrowth ?? null,
    fairValueConsensus: valuation?.fairValueConsensus ?? null,
    upsidePct: valuation?.upsidePct ?? null,
    investmentScore: valuation?.scores?.investment ?? null,
    valueScore: valuation?.scores?.value ?? null,
    qualityScore: valuation?.scores?.quality ?? null,
    growthScore: valuation?.scores?.growth ?? null,
    momentumScore: valuation?.scores?.momentum ?? null,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Falta el parámetro symbols" }, { status: 400 });
  }

  const symbols = [
    ...new Set(
      symbolsParam
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    ),
  ].slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "Falta el parámetro symbols" }, { status: 400 });
  }

  const cookie = request.headers.get("cookie") ?? "";
  const results = await Promise.all(symbols.map((s) => compareSymbol(url.origin, s, cookie)));

  return NextResponse.json({ results });
}
