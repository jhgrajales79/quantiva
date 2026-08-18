export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface Quote {
  symbol: string;
  price: number;
  changeAbs: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  source: string;
  fetchedAt: string; // ISO timestamp
}

export interface PricePoint {
  date: string; // YYYY-MM-DD
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface Fundamentals {
  symbol: string;
  period: "annual" | "quarter" | "ttm";
  fiscalDate: string;
  revenue: number | null;
  ebitda: number | null;
  ebit: number | null;
  netIncome: number | null;
  eps: number | null;
  fcf: number | null;
  totalDebt: number | null;
  cash: number | null;
  sharesOutstanding: number | null;
  bookValuePerShare: number | null;
  beta: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  source: string;
}

export interface Ratios {
  symbol: string;
  period: "annual" | "quarter" | "ttm";
  fiscalDate: string;
  pe: number | null;
  forwardPe: number | null;
  ps: number | null;
  pb: number | null;
  evEbitda: number | null;
  fcfYield: number | null;
  dividendYield: number | null;
  roe: number | null;
  roic: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  debtToEbitda: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  source: string;
}

export interface Dividend {
  exDate: string;
  paymentDate: string | null;
  recordDate: string | null;
  amount: number;
  frequency: string | null;
}

export interface EarningsEvent {
  symbol: string;
  reportDate: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
}

export interface EtfHolding {
  symbol: string;
  name: string;
  weightPct: number;
}

export interface SymbolMatch {
  symbol: string;
  name: string;
  assetType: "stock" | "etf" | "crypto";
  exchange: string | null;
}

export interface NewsArticle {
  source: string;
  publishedAt: string;
  title: string;
  summary: string | null;
  url: string;
  relatedSymbols: string[];
}

export interface MarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<Quote | null>;
  getDailyPrices(symbol: string, range: DateRange): Promise<PricePoint[]>;
  getFundamentals(symbol: string): Promise<Fundamentals | null>;
  getRatios(symbol: string): Promise<Ratios | null>;
  getRatiosHistory(symbol: string, limit: number): Promise<Ratios[]>;
  getDividends(symbol: string): Promise<Dividend[]>;
  getEarningsCalendar(range: DateRange): Promise<EarningsEvent[]>;
  getEtfHoldings(symbol: string): Promise<EtfHolding[]>;
  searchSymbols(query: string): Promise<SymbolMatch[]>;
  getCompanyNews(symbol: string): Promise<NewsArticle[]>;
  getGainersLosersActive(): Promise<{
    gainers: Quote[];
    losers: Quote[];
    mostActive: Quote[];
  }>;
}

export interface MacroSeriesPoint {
  date: string;
  value: number;
}

export interface MacroDataProvider {
  readonly name: string;
  getSeries(code: string): Promise<MacroSeriesPoint[]>;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  marketCap: number | null;
  volume24h: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  circulatingSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
}

export interface CryptoDataProvider {
  readonly name: string;
  getTopByMarketCap(limit: number): Promise<CryptoQuote[]>;
  getQuote(idOrSymbol: string): Promise<CryptoQuote | null>;
}
