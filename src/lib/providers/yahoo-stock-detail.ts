import { z } from "zod";
import { yahooFetchPublic, yahooFetchWithCrumb } from "./yahoo-http";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);
const rawNum = z
  .object({ raw: nullableNumber })
  .partial()
  .transform((v) => v.raw ?? null)
  .or(z.null())
  .catch(null);

// ---------------------------------------------------------------------------
// Perfil de empresa (assetProfile)
// ---------------------------------------------------------------------------

const companyOfficerSchema = z.object({
  name: z.string(),
  title: z.string(),
});

const quoteSummarySchema = <T extends z.ZodTypeAny>(shape: T) =>
  z.object({
    quoteSummary: z.object({
      result: z.array(shape).nullable(),
    }),
  });

const assetProfileSchema = z.object({
  assetProfile: z
    .object({
      sector: z.string().nullable().optional(),
      industry: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      longBusinessSummary: z.string().nullable().optional(),
      fullTimeEmployees: nullableNumber,
      companyOfficers: z.array(companyOfficerSchema).optional(),
    })
    .optional(),
});

const chartMetaSchema = z.object({
  chart: z.object({
    result: z
      .array(z.object({ meta: z.object({ firstTradeDate: nullableNumber }) }))
      .nullable(),
  }),
});

/** Fecha de salida a bolsa real (primer dato disponible en el histórico de Yahoo). */
export async function getFirstTradeDate(symbol: string): Promise<string | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=max&interval=1mo`;
  const result = await yahooFetchPublic(url, chartMetaSchema);
  const epoch = result.chart.result?.[0]?.meta.firstTradeDate;
  return epoch ? new Date(epoch * 1000).toISOString().slice(0, 10) : null;
}

const overviewSchema = z.object({
  quoteSummary: z.object({
    result: z
      .array(
        z.object({
          defaultKeyStatistics: z
            .object({ beta: rawNum, enterpriseValue: rawNum, sharesOutstanding: rawNum })
            .optional(),
        }),
      )
      .nullable(),
  }),
});

export interface StockOverview {
  marketCap: number | null;
  enterpriseValue: number | null;
  beta: number | null;
}

/** Market cap, enterprise value y beta requieren crumb; el rango de 52
 * semanas y el exchange ya vienen gratis en el chart meta usado por
 * `getQuote` (ver `Quote.fiftyTwoWeekLow/High` y `Quote.exchangeName`). */
export async function getStockOverview(symbol: string, currentPrice: number): Promise<StockOverview> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics&crumb=${encodeURIComponent(crumb)}`,
    overviewSchema,
  );
  const r = result.quoteSummary.result?.[0];
  const sharesOutstanding = r?.defaultKeyStatistics?.sharesOutstanding ?? null;

  return {
    marketCap: sharesOutstanding !== null ? sharesOutstanding * currentPrice : null,
    enterpriseValue: r?.defaultKeyStatistics?.enterpriseValue ?? null,
    beta: r?.defaultKeyStatistics?.beta ?? null,
  };
}

export interface CompanyProfile {
  sector: string | null;
  industry: string | null;
  website: string | null;
  businessSummary: string | null;
  employees: number | null;
  ceoName: string | null;
  firstTradeDate: string | null; // fecha de salida a bolsa, del chart meta
}

export async function getCompanyProfile(
  symbol: string,
  firstTradeDate: string | null,
): Promise<CompanyProfile | null> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(assetProfileSchema),
  );
  const profile = result.quoteSummary.result?.[0]?.assetProfile;
  if (!profile) return null;

  const ceo = profile.companyOfficers?.find((o) => /CEO|Chief Executive/i.test(o.title));

  return {
    sector: profile.sector ?? null,
    industry: profile.industry ?? null,
    website: profile.website ?? null,
    businessSummary: profile.longBusinessSummary ?? null,
    employees: profile.fullTimeEmployees ?? null,
    ceoName: ceo?.name ?? null,
    firstTradeDate,
  };
}

// ---------------------------------------------------------------------------
// Analistas (recommendationTrend + upgradeDowngradeHistory + price targets)
// ---------------------------------------------------------------------------

const recommendationTrendSchema = z.object({
  recommendationTrend: z
    .object({
      trend: z.array(
        z.object({
          period: z.string(),
          strongBuy: z.number(),
          buy: z.number(),
          hold: z.number(),
          sell: z.number(),
          strongSell: z.number(),
        }),
      ),
    })
    .optional(),
  upgradeDowngradeHistory: z
    .object({
      history: z.array(
        z.object({
          epochGradeDate: z.number(),
          firm: z.string(),
          toGrade: z.string(),
          fromGrade: z.string().optional(),
          action: z.string(),
          currentPriceTarget: nullableNumber.optional(),
          priorPriceTarget: nullableNumber.optional(),
        }),
      ),
    })
    .optional(),
  financialData: z
    .object({
      targetMeanPrice: rawNum,
      targetHighPrice: rawNum,
      targetLowPrice: rawNum,
      recommendationKey: z.string().optional(),
      numberOfAnalystOpinions: rawNum,
    })
    .optional(),
});

export interface AnalystData {
  distribution: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  recentChanges: {
    date: string;
    firm: string;
    toGrade: string;
    fromGrade: string | null;
    action: string;
    priceTarget: number | null;
  }[];
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  numberOfAnalysts: number | null;
}

export async function getAnalystData(symbol: string): Promise<AnalystData> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=recommendationTrend,upgradeDowngradeHistory,financialData&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(recommendationTrendSchema),
  );
  const r = result.quoteSummary.result?.[0];

  const current = r?.recommendationTrend?.trend.find((t) => t.period === "0m");

  return {
    distribution: current
      ? {
          strongBuy: current.strongBuy,
          buy: current.buy,
          hold: current.hold,
          sell: current.sell,
          strongSell: current.strongSell,
        }
      : null,
    recentChanges: (r?.upgradeDowngradeHistory?.history ?? [])
      .sort((a, b) => b.epochGradeDate - a.epochGradeDate)
      .slice(0, 8)
      .map((h) => ({
        date: new Date(h.epochGradeDate * 1000).toISOString().slice(0, 10),
        firm: h.firm,
        toGrade: h.toGrade,
        fromGrade: h.fromGrade ?? null,
        action: h.action,
        priceTarget: h.currentPriceTarget ?? null,
      })),
    targetMeanPrice: r?.financialData?.targetMeanPrice ?? null,
    targetHighPrice: r?.financialData?.targetHighPrice ?? null,
    targetLowPrice: r?.financialData?.targetLowPrice ?? null,
    numberOfAnalysts: r?.financialData?.numberOfAnalystOpinions ?? null,
  };
}

// ---------------------------------------------------------------------------
// Reportes SEC
// ---------------------------------------------------------------------------

const secFilingsSchema = z.object({
  secFilings: z
    .object({
      filings: z.array(
        z.object({
          date: z.string(),
          type: z.string(),
          title: z.string(),
          edgarUrl: z.string(),
        }),
      ),
    })
    .optional(),
});

export interface SecFiling {
  date: string;
  type: string;
  title: string;
  edgarUrl: string;
}

export async function getSecFilings(symbol: string): Promise<SecFiling[]> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=secFilings&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(secFilingsSchema),
  );
  return (result.quoteSummary.result?.[0]?.secFilings?.filings ?? []).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Empresas similares
// ---------------------------------------------------------------------------

const recommendationsSchema = z.object({
  finance: z.object({
    result: z
      .array(
        z.object({
          symbol: z.string(),
          recommendedSymbols: z.array(z.object({ symbol: z.string(), score: z.number() })),
        }),
      )
      .nullable(),
  }),
});

export async function getPeerSymbols(symbol: string): Promise<string[]> {
  const url = `https://query1.finance.yahoo.com/v6/finance/recommendationsbysymbol/${symbol}`;
  const result = await yahooFetchPublic(url, recommendationsSchema);
  return (result.finance.result?.[0]?.recommendedSymbols ?? []).slice(0, 5).map((r) => r.symbol);
}

// ---------------------------------------------------------------------------
// Calendario de earnings (por símbolo)
// ---------------------------------------------------------------------------

const calendarEventsSchema = z.object({
  calendarEvents: z
    .object({
      earnings: z
        .object({
          earningsDate: z.array(rawNum).optional(),
          isEarningsDateEstimate: z.boolean().optional(),
          earningsAverage: rawNum,
          revenueAverage: rawNum,
        })
        .optional(),
    })
    .optional(),
});

export interface EarningsCalendarEntry {
  reportDate: string;
  isEstimate: boolean;
  epsEstimate: number | null;
  revenueEstimate: number | null;
}

export async function getCalendarEvents(symbol: string): Promise<EarningsCalendarEntry | null> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=calendarEvents&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(calendarEventsSchema),
  );
  const earnings = result.quoteSummary.result?.[0]?.calendarEvents?.earnings;
  const dateEpoch = earnings?.earningsDate?.[0];
  if (!earnings || dateEpoch === null || dateEpoch === undefined) return null;

  return {
    reportDate: new Date(dateEpoch * 1000).toISOString().slice(0, 10),
    isEstimate: earnings.isEarningsDateEstimate ?? true,
    epsEstimate: earnings.earningsAverage,
    revenueEstimate: earnings.revenueAverage,
  };
}

// ---------------------------------------------------------------------------
// Estimados de crecimiento (earningsTrend) — para "Estimados"/"Crecimiento"
// ---------------------------------------------------------------------------

const earningsTrendSchema = z.object({
  earningsTrend: z
    .object({
      trend: z.array(
        z.object({
          period: z.string(),
          earningsEstimate: z.object({ avg: rawNum }).optional(),
        }),
      ),
    })
    .optional(),
});

export async function getForwardEpsEstimate(symbol: string): Promise<number | null> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=earningsTrend&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(earningsTrendSchema),
  );
  const trend = result.quoteSummary.result?.[0]?.earningsTrend?.trend ?? [];
  const nextYear = trend.find((t) => t.period === "+1y");
  return nextYear?.earningsEstimate?.avg ?? null;
}
