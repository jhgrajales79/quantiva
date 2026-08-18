import { z } from "zod";
import { yahooFetchPublic, yahooFetchWithCrumb } from "./yahoo-http";
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

const nullableNumber = z.union([z.number(), z.null()]).catch(null);
const rawNum = z
  .object({ raw: nullableNumber })
  .partial()
  .transform((v) => v.raw ?? null)
  .or(z.null())
  .catch(null);

function epochToDate(seconds: number | null): string | null {
  if (seconds === null) return null;
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// /v8/finance/chart — precio, OHLC histórico y dividendos. No requiere crumb.
// ---------------------------------------------------------------------------

const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({
            symbol: z.string(),
            regularMarketPrice: nullableNumber,
            chartPreviousClose: nullableNumber,
            regularMarketDayHigh: nullableNumber,
            regularMarketDayLow: nullableNumber,
            regularMarketVolume: nullableNumber,
          }),
          timestamp: z.array(z.number()).optional(),
          indicators: z
            .object({
              quote: z
                .array(
                  z.object({
                    open: z.array(nullableNumber).optional(),
                    high: z.array(nullableNumber).optional(),
                    low: z.array(nullableNumber).optional(),
                    close: z.array(nullableNumber).optional(),
                    volume: z.array(nullableNumber).optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
          events: z
            .object({
              dividends: z
                .record(z.string(), z.object({ amount: z.number(), date: z.number() }))
                .optional(),
            })
            .optional(),
        }),
      )
      .nullable(),
    error: z.unknown().nullable(),
  }),
});

async function fetchChart(symbol: string, range: string, interval: string, events?: string) {
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
  url.searchParams.set("range", range);
  url.searchParams.set("interval", interval);
  if (events) url.searchParams.set("events", events);

  const data = await yahooFetchPublic(url.toString(), chartSchema);
  return data.chart.result?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// /v10/finance/quoteSummary — fundamentales, ratios, ETF holdings. Requiere
// crumb+cookie.
// ---------------------------------------------------------------------------

const quoteSummarySchema = z.object({
  quoteSummary: z.object({
    result: z
      .array(
        z.object({
          summaryDetail: z
            .object({
              trailingPE: rawNum,
              dividendYield: rawNum,
              exDividendDate: rawNum,
              payoutRatio: rawNum,
              dividendRate: rawNum,
              previousClose: rawNum,
            })
            .partial()
            .optional(),
          defaultKeyStatistics: z
            .object({
              beta: rawNum,
              bookValue: rawNum,
              priceToBook: rawNum,
              enterpriseToEbitda: rawNum,
              forwardPE: rawNum,
              trailingEps: rawNum,
              sharesOutstanding: rawNum,
              netIncomeToCommon: rawNum,
              mostRecentQuarter: rawNum,
              lastFiscalYearEnd: rawNum,
              enterpriseValue: rawNum,
            })
            .partial()
            .optional(),
          financialData: z
            .object({
              totalRevenue: rawNum,
              ebitda: rawNum,
              freeCashflow: rawNum,
              totalDebt: rawNum,
              totalCash: rawNum,
              returnOnEquity: rawNum,
              returnOnAssets: rawNum,
              grossMargins: rawNum,
              operatingMargins: rawNum,
              revenueGrowth: rawNum,
              earningsGrowth: rawNum,
              currentPrice: rawNum,
            })
            .partial()
            .optional(),
          topHoldings: z
            .object({
              holdings: z
                .array(
                  z.object({
                    symbol: z.string(),
                    holdingName: z.string().optional(),
                    holdingPercent: rawNum,
                  }),
                )
                .optional(),
            })
            .partial()
            .optional(),
        }),
      )
      .nullable(),
    error: z.unknown().nullable(),
  }),
});

async function fetchQuoteSummary(symbol: string, modules: string[]) {
  const data = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=${modules.join(",")}&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema,
  );
  return data.quoteSummary.result?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// /v1/finance/search — búsqueda de símbolos + noticias relacionadas. No
// requiere crumb.
// ---------------------------------------------------------------------------

const searchSchema = z.object({
  quotes: z
    .array(
      z.object({
        symbol: z.string(),
        shortname: z.string().optional(),
        longname: z.string().optional(),
        quoteType: z.string().optional(),
        exchange: z.string().optional(),
      }),
    )
    .optional(),
  news: z
    .array(
      z.object({
        title: z.string(),
        publisher: z.string().optional(),
        link: z.string(),
        providerPublishTime: z.number(),
        relatedTickers: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

function mapAssetType(quoteType: string | undefined): "stock" | "etf" | "crypto" {
  if (quoteType === "ETF") return "etf";
  if (quoteType === "CRYPTOCURRENCY") return "crypto";
  return "stock";
}

// ---------------------------------------------------------------------------
// /v1/finance/screener/predefined/saved — movers. No requiere crumb.
// ---------------------------------------------------------------------------

const screenerQuoteSchema = z.object({
  symbol: z.string(),
  longName: z.string().optional(),
  shortName: z.string().optional(),
  regularMarketPrice: nullableNumber,
  regularMarketChange: nullableNumber,
  regularMarketChangePercent: nullableNumber,
  regularMarketDayHigh: nullableNumber,
  regularMarketDayLow: nullableNumber,
  regularMarketVolume: nullableNumber,
  marketCap: nullableNumber,
});

const screenerSchema = z.object({
  finance: z.object({
    result: z
      .array(z.object({ quotes: z.array(screenerQuoteSchema) }))
      .nullable(),
    error: z.unknown().nullable(),
  }),
});

async function fetchScreener(scrId: string, count: number) {
  const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=${count}&scrIds=${scrId}`;
  const data = await yahooFetchPublic(url, screenerSchema);
  return data.finance.result?.[0]?.quotes ?? [];
}

function screenerQuoteToQuote(q: z.infer<typeof screenerQuoteSchema>, source: string): Quote {
  return {
    symbol: q.symbol,
    price: q.regularMarketPrice ?? 0,
    changeAbs: q.regularMarketChange,
    changePct: q.regularMarketChangePercent,
    dayHigh: q.regularMarketDayHigh,
    dayLow: q.regularMarketDayLow,
    volume: q.regularMarketVolume,
    marketCap: q.marketCap,
    source,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class YahooFinanceProvider implements MarketDataProvider {
  readonly name = "Yahoo Finance";

  async getQuote(symbol: string): Promise<Quote | null> {
    const result = await fetchChart(symbol, "5d", "1d");
    if (!result) return null;
    const { meta } = result;
    if (meta.regularMarketPrice === null) return null;

    const changeAbs =
      meta.chartPreviousClose !== null ? meta.regularMarketPrice - meta.chartPreviousClose : null;
    const changePct =
      changeAbs !== null && meta.chartPreviousClose
        ? (changeAbs / meta.chartPreviousClose) * 100
        : null;

    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      changeAbs,
      changePct,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      marketCap: null, // requiere quoteSummary (crumb); se omite para mantener getQuote rápido
      source: this.name,
      fetchedAt: new Date().toISOString(),
    };
  }

  async getDailyPrices(symbol: string, range: DateRange): Promise<PricePoint[]> {
    const fromMs = new Date(range.from).getTime();
    const daysSpan = Math.ceil((Date.now() - fromMs) / 86_400_000);
    const yahooRange =
      daysSpan <= 7 ? "5d" : daysSpan <= 35 ? "1mo" : daysSpan <= 100 ? "3mo" : daysSpan <= 200 ? "6mo" : daysSpan <= 400 ? "1y" : "2y";

    const result = await fetchChart(symbol, yahooRange, "1d");
    if (!result?.timestamp || !result.indicators?.quote?.[0]) return [];

    const q = result.indicators.quote[0];
    return result.timestamp.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: q.open?.[i] ?? null,
      high: q.high?.[i] ?? null,
      low: q.low?.[i] ?? null,
      close: q.close?.[i] ?? 0,
      volume: q.volume?.[i] ?? null,
    }));
  }

  async getFundamentals(symbol: string): Promise<Fundamentals | null> {
    const summary = await fetchQuoteSummary(symbol, ["financialData", "defaultKeyStatistics"]);
    if (!summary) return null;

    const fd = summary.financialData ?? {};
    const ks = summary.defaultKeyStatistics ?? {};

    const fiscalDate =
      epochToDate(ks.mostRecentQuarter ?? null) ?? epochToDate(ks.lastFiscalYearEnd ?? null);
    if (!fiscalDate) return null;

    return {
      symbol,
      period: "ttm",
      fiscalDate,
      revenue: fd.totalRevenue ?? null,
      ebitda: fd.ebitda ?? null,
      ebit: null, // Yahoo no expone EBIT de forma confiable en estos módulos
      netIncome: ks.netIncomeToCommon ?? null,
      eps: ks.trailingEps ?? null,
      fcf: fd.freeCashflow ?? null,
      totalDebt: fd.totalDebt ?? null,
      cash: fd.totalCash ?? null,
      sharesOutstanding: ks.sharesOutstanding ?? null,
      bookValuePerShare: ks.bookValue ?? null,
      beta: ks.beta ?? null,
      revenueGrowth: fd.revenueGrowth ?? null,
      epsGrowth: fd.earningsGrowth ?? null, // proxy: crecimiento de earnings, no EPS puro
      source: this.name,
    };
  }

  async getRatios(symbol: string): Promise<Ratios | null> {
    const summary = await fetchQuoteSummary(symbol, [
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
    ]);
    if (!summary) return null;

    const sd = summary.summaryDetail ?? {};
    const ks = summary.defaultKeyStatistics ?? {};
    const fd = summary.financialData ?? {};

    const sharesOutstanding = ks.sharesOutstanding ?? null;
    const currentPrice = fd.currentPrice ?? null;
    const totalRevenue = fd.totalRevenue ?? null;
    const freeCashflow = fd.freeCashflow ?? null;
    const totalDebt = fd.totalDebt ?? null;
    const ebitda = fd.ebitda ?? null;

    const marketCap =
      sharesOutstanding !== null && currentPrice !== null ? sharesOutstanding * currentPrice : null;

    const ps = marketCap !== null && totalRevenue ? marketCap / totalRevenue : null;
    const fcfYield = freeCashflow !== null && marketCap ? freeCashflow / marketCap : null;
    const debtToEbitda = totalDebt !== null && ebitda ? totalDebt / ebitda : null;

    const fiscalDate =
      epochToDate(ks.mostRecentQuarter ?? null) ?? epochToDate(ks.lastFiscalYearEnd ?? null);
    if (!fiscalDate) return null;

    return {
      symbol,
      period: "ttm",
      fiscalDate,
      pe: sd.trailingPE ?? null,
      forwardPe: ks.forwardPE ?? null,
      ps,
      pb: ks.priceToBook ?? null,
      evEbitda: ks.enterpriseToEbitda ?? null,
      fcfYield,
      dividendYield: sd.dividendYield ?? null,
      roe: fd.returnOnEquity ?? null,
      roic: null, // Yahoo no expone ROIC directamente
      grossMargin: fd.grossMargins ?? null,
      operatingMargin: fd.operatingMargins ?? null,
      debtToEbitda,
      revenueGrowth: fd.revenueGrowth ?? null,
      epsGrowth: fd.earningsGrowth ?? null,
      source: this.name,
    };
  }

  async getRatiosHistory(symbol: string, limit: number): Promise<Ratios[]> {
    // Yahoo solo expone el snapshot TTM actual, no una serie histórica de
    // ratios por período — se retorna un único punto en vez de inventar
    // historial. Los modelos de valoración relativos requerirán que la app
    // acumule su propio histórico llamando esto periódicamente (cron).
    const current = await this.getRatios(symbol);
    return current ? [current].slice(0, limit) : [];
  }

  async getDividends(symbol: string): Promise<Dividend[]> {
    const result = await fetchChart(symbol, "5y", "1d", "div");
    const dividends = result?.events?.dividends;
    if (!dividends) return [];

    return Object.values(dividends)
      .map((d) => ({
        exDate: new Date(d.date * 1000).toISOString().slice(0, 10),
        paymentDate: null,
        recordDate: null,
        amount: d.amount,
        frequency: null,
      }))
      .sort((a, b) => b.exDate.localeCompare(a.exDate));
  }

  async getEarningsCalendar(_range: DateRange): Promise<EarningsEvent[]> {
    // Yahoo no ofrece un calendario de resultados por rango de fechas sin
    // crumb ni un endpoint público estable para todo el mercado. Se retorna
    // vacío explícitamente en vez de aproximar con datos parciales.
    void _range;
    return [];
  }

  async getEtfHoldings(symbol: string): Promise<EtfHolding[]> {
    const summary = await fetchQuoteSummary(symbol, ["topHoldings"]);
    const holdings = summary?.topHoldings?.holdings ?? [];
    return holdings.map((h) => ({
      symbol: h.symbol,
      name: h.holdingName ?? h.symbol,
      weightPct: (h.holdingPercent ?? 0) * 100,
    }));
  }

  async searchSymbols(query: string): Promise<SymbolMatch[]> {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
    const data = await yahooFetchPublic(url, searchSchema);
    return (data.quotes ?? []).map((q) => ({
      symbol: q.symbol,
      name: q.longname ?? q.shortname ?? q.symbol,
      assetType: mapAssetType(q.quoteType),
      exchange: q.exchange ?? null,
    }));
  }

  async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=10&quotesCount=0`;
    const data = await yahooFetchPublic(url, searchSchema);
    return (data.news ?? []).map((n) => ({
      source: n.publisher ?? this.name,
      publishedAt: new Date(n.providerPublishTime * 1000).toISOString(),
      title: n.title,
      summary: null,
      url: n.link,
      relatedSymbols: n.relatedTickers?.length ? n.relatedTickers : [symbol],
    }));
  }

  async getGainersLosersActive() {
    const [gainersRaw, losersRaw, mostActiveRaw] = await Promise.all([
      fetchScreener("day_gainers", 25),
      fetchScreener("day_losers", 25),
      fetchScreener("most_actives", 25),
    ]);

    return {
      gainers: gainersRaw.map((q) => screenerQuoteToQuote(q, this.name)),
      losers: losersRaw.map((q) => screenerQuoteToQuote(q, this.name)),
      mostActive: mostActiveRaw.map((q) => screenerQuoteToQuote(q, this.name)),
    };
  }
}
