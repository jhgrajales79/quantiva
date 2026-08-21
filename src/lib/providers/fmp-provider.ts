import { z } from "zod";
import type {
  DateRange,
  Dividend,
  EarningsEvent,
  EtfHolding,
  Fundamentals,
  MarketDataProvider,
  NewsArticle,
  PricePoint,
  Quote,
  Ratios,
  SymbolMatch,
} from "./types";

const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);

const quoteSchema = z.object({
  symbol: z.string(),
  price: nullableNumber,
  change: nullableNumber,
  changePercentage: nullableNumber,
  dayLow: nullableNumber,
  dayHigh: nullableNumber,
  volume: nullableNumber,
  marketCap: nullableNumber,
});

const profileSchema = z.object({
  symbol: z.string(),
  companyName: z.string().optional(),
  sector: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  beta: nullableNumber,
});

const historicalPriceSchema = z.object({
  date: z.string(),
  open: nullableNumber,
  high: nullableNumber,
  low: nullableNumber,
  close: z.number(),
  volume: nullableNumber,
});

const incomeStatementSchema = z.object({
  date: z.string(),
  revenue: nullableNumber,
  ebitda: nullableNumber,
  operatingIncome: nullableNumber,
  netIncome: nullableNumber,
  eps: nullableNumber,
});

const balanceSheetSchema = z.object({
  date: z.string(),
  totalDebt: nullableNumber,
  cashAndCashEquivalents: nullableNumber,
  commonStockSharesOutstanding: nullableNumber,
  totalStockholdersEquity: nullableNumber,
});

const cashFlowSchema = z.object({
  date: z.string(),
  freeCashFlow: nullableNumber,
});

const ratiosSchema = z.object({
  date: z.string(),
  priceToEarningsRatio: nullableNumber,
  priceToSalesRatio: nullableNumber,
  priceToBookRatio: nullableNumber,
  enterpriseValueMultiple: nullableNumber,
  freeCashFlowYield: nullableNumber,
  dividendYield: nullableNumber,
  returnOnEquity: nullableNumber,
  returnOnInvestedCapital: nullableNumber,
  grossProfitMargin: nullableNumber,
  operatingProfitMargin: nullableNumber,
  debtToEbitda: nullableNumber,
});

const dividendSchema = z.object({
  date: z.string(),
  paymentDate: z.string().nullable().optional(),
  recordDate: z.string().nullable().optional(),
  dividend: z.number(),
  frequency: z.string().nullable().optional(),
});

const earningsSchema = z.object({
  symbol: z.string(),
  date: z.string(),
  epsEstimated: nullableNumber,
  eps: nullableNumber,
  revenueEstimated: nullableNumber,
  revenue: nullableNumber,
});

const etfHoldingSchema = z.object({
  asset: z.string(),
  name: z.string().optional(),
  weightPercentage: nullableNumber,
});

const searchSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  exchangeShortName: z.string().nullable().optional(),
});

const newsSchema = z.object({
  publishedDate: z.string(),
  title: z.string(),
  text: z.string().nullable().optional(),
  url: z.string(),
  site: z.string().optional(),
  symbol: z.string().optional(),
});

async function fetchJson<T>(
  path: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error(
      "FMP_API_KEY no está configurada. Este dato no se puede obtener sin credenciales del proveedor.",
    );
  }

  const url = new URL(`${FMP_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`FMP request failed: ${res.status} ${res.statusText} (${path})`);
  }

  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`FMP response validation failed for ${path}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export class FmpProvider implements MarketDataProvider {
  readonly name = "Financial Modeling Prep";

  async getQuote(symbol: string): Promise<Quote | null> {
    const data = await fetchJson(
      "/quote",
      { symbol },
      z.array(quoteSchema),
    );
    const q = data?.[0];
    if (!q) return null;

    return {
      symbol: q.symbol,
      companyName: null,
      price: q.price ?? 0,
      changeAbs: q.change,
      changePct: q.changePercentage,
      dayHigh: q.dayHigh,
      dayLow: q.dayLow,
      volume: q.volume,
      marketCap: q.marketCap,
      fiftyTwoWeekLow: null,
      fiftyTwoWeekHigh: null,
      exchangeName: null,
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getDailyPrices(symbol: string, range: DateRange): Promise<PricePoint[]> {
    const data = await fetchJson(
      "/historical-price-eod/full",
      { symbol, from: range.from, to: range.to },
      z.array(historicalPriceSchema),
    );
    return (data ?? []).map((p) => ({
      date: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const [income, balance, cashFlow, profile] = await Promise.all([
      fetchJson("/income-statement", { symbol, limit: "2" }, z.array(incomeStatementSchema)),
      fetchJson("/balance-sheet-statement", { symbol, limit: "1" }, z.array(balanceSheetSchema)),
      fetchJson("/cash-flow-statement", { symbol, limit: "1" }, z.array(cashFlowSchema)),
      fetchJson("/profile", { symbol }, z.array(profileSchema)),
    ]);

    const inc = income?.[0];
    if (!inc) return null;
    const prevInc = income?.[1] ?? null;
    const bal = balance?.[0];
    const cf = cashFlow?.[0];
    const prof = profile?.[0];

    const sharesOutstanding = bal?.commonStockSharesOutstanding ?? null;
    const bookValuePerShare =
      bal?.totalStockholdersEquity != null && sharesOutstanding
        ? bal.totalStockholdersEquity / sharesOutstanding
        : null;

    const revenueGrowth =
      inc.revenue != null && prevInc?.revenue
        ? (inc.revenue - prevInc.revenue) / Math.abs(prevInc.revenue)
        : null;
    const epsGrowth =
      inc.eps != null && prevInc?.eps
        ? (inc.eps - prevInc.eps) / Math.abs(prevInc.eps)
        : null;

    return {
      symbol,
      period: "annual",
      fiscalDate: inc.date,
      revenue: inc.revenue,
      ebitda: inc.ebitda,
      ebit: inc.operatingIncome,
      netIncome: inc.netIncome,
      eps: inc.eps,
      fcf: cf?.freeCashFlow ?? null,
      totalDebt: bal?.totalDebt ?? null,
      cash: bal?.cashAndCashEquivalents ?? null,
      sharesOutstanding,
      bookValuePerShare,
      beta: prof?.beta ?? null,
      revenueGrowth,
      epsGrowth,
      source: this.name,
    };
  }

  async getRatios(symbol: string): Promise<Ratios | null> {
    const history = await this.getRatiosHistory(symbol, 1);
    return history[0] ?? null;
  }

  async getRatiosHistory(symbol: string, limit: number): Promise<Ratios[]> {
    // Sin `period`, /ratios devuelve un punto real por año fiscal (FY) — se
    // pide explícito para no depender de un default no documentado. El plan
    // de FMP configurado limita esta ruta a 5 períodos (ver llamador).
    const data = await fetchJson(
      "/ratios",
      { symbol, period: "annual", limit: String(limit) },
      z.array(ratiosSchema),
    );

    return (data ?? []).map((r) => ({
      symbol,
      period: "annual" as const,
      fiscalDate: r.date,
      pe: r.priceToEarningsRatio,
      forwardPe: null,
      ps: r.priceToSalesRatio,
      pb: r.priceToBookRatio,
      evEbitda: r.enterpriseValueMultiple,
      fcfYield: r.freeCashFlowYield,
      dividendYield: r.dividendYield,
      roe: r.returnOnEquity,
      roic: r.returnOnInvestedCapital,
      grossMargin: r.grossProfitMargin,
      operatingMargin: r.operatingProfitMargin,
      debtToEbitda: r.debtToEbitda,
      revenueGrowth: null,
      epsGrowth: null,
      source: this.name,
    }));
  }

  async getDividends(symbol: string): Promise<Dividend[]> {
    const data = await fetchJson(
      "/dividends",
      { symbol },
      z.array(dividendSchema),
    );
    return (data ?? []).map((d) => ({
      exDate: d.date,
      paymentDate: d.paymentDate ?? null,
      recordDate: d.recordDate ?? null,
      amount: d.dividend,
      frequency: d.frequency ?? null,
    }));
  }

  async getEarningsCalendar(range: DateRange): Promise<EarningsEvent[]> {
    const data = await fetchJson(
      "/earnings-calendar",
      { from: range.from, to: range.to },
      z.array(earningsSchema),
    );
    return (data ?? []).map((e) => ({
      symbol: e.symbol,
      reportDate: e.date,
      epsEstimate: e.epsEstimated,
      epsActual: e.eps,
      revenueEstimate: e.revenueEstimated,
      revenueActual: e.revenue,
    }));
  }

  async getEtfHoldings(symbol: string): Promise<EtfHolding[]> {
    const data = await fetchJson(
      "/etf/holdings",
      { symbol },
      z.array(etfHoldingSchema),
    );
    return (data ?? []).map((h) => ({
      symbol: h.asset,
      name: h.name ?? h.asset,
      weightPct: h.weightPercentage ?? 0,
    }));
  }

  async searchSymbols(query: string): Promise<SymbolMatch[]> {
    const data = await fetchJson(
      "/search-symbol",
      { query },
      z.array(searchSchema),
    );
    return (data ?? []).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      assetType: "stock" as const,
      exchange: s.exchangeShortName ?? null,
    }));
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    const data = await fetchJson(
      "/news/stock",
      { symbols: symbol },
      z.array(newsSchema),
    );
    return (data ?? []).map((n) => ({
      source: n.site ?? this.name,
      publishedAt: n.publishedDate,
      title: n.title,
      summary: n.text ?? null,
      url: n.url,
      relatedSymbols: n.symbol ? [n.symbol] : [symbol],
    }));
  }

  async getGainersLosersActive() {
    const [gainers, losers, mostActive] = await Promise.all([
      fetchJson("/biggest-gainers", {}, z.array(quoteSchema)),
      fetchJson("/biggest-losers", {}, z.array(quoteSchema)),
      fetchJson("/most-actives", {}, z.array(quoteSchema)),
    ]);

    const toQuote = (q: z.infer<typeof quoteSchema>): Quote => ({
      symbol: q.symbol,
      companyName: null,
      price: q.price ?? 0,
      changeAbs: q.change,
      changePct: q.changePercentage,
      dayHigh: q.dayHigh,
      dayLow: q.dayLow,
      volume: q.volume,
      marketCap: q.marketCap,
      fiftyTwoWeekLow: null,
      fiftyTwoWeekHigh: null,
      exchangeName: null,
      source: this.name,
      fetchedAt: new Date().toISOString(),
    });

    return {
      gainers: (gainers ?? []).map(toQuote),
      losers: (losers ?? []).map(toQuote),
      mostActive: (mostActive ?? []).map(toQuote),
    };
  }
}
