import { z } from "zod";
import { yahooFetchPublic, yahooFetchWithCrumb } from "./yahoo-http";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);
const rawNum = z
  .object({ raw: nullableNumber })
  .partial()
  .transform((v) => v.raw ?? null)
  .or(z.null())
  .catch(null);

const rawFmt = z
  .object({ fmt: z.string().nullable().optional() })
  .partial()
  .transform((v) => v.fmt ?? null)
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

// ---------------------------------------------------------------------------
// ETFs (topHoldings + fundProfile)
// ---------------------------------------------------------------------------

const etfProfileSchema = z.object({
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
      sectorWeightings: z
        .array(z.record(z.string(), rawNum))
        .optional(),
      stockPosition: rawNum,
      bondPosition: rawNum,
      cashPosition: rawNum,
    })
    .optional(),
  fundProfile: z
    .object({
      family: z.string().nullable().optional(),
      categoryName: z.string().nullable().optional(),
      legalType: z.string().nullable().optional(),
      feesExpensesInvestment: z
        .object({
          annualReportExpenseRatio: rawNum,
          totalNetAssets: rawNum,
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export interface EtfProfile {
  holdings: { symbol: string; name: string; weightPct: number }[];
  sectorWeightings: { sector: string; weightPct: number }[];
  stockPositionPct: number | null;
  bondPositionPct: number | null;
  cashPositionPct: number | null;
  family: string | null;
  category: string | null;
  legalType: string | null;
  expenseRatio: number | null;
  totalNetAssets: number | null; // en millones USD, según Yahoo
}

export async function getEtfProfile(symbol: string): Promise<EtfProfile | null> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=topHoldings,fundProfile&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(etfProfileSchema),
  );
  const r = result.quoteSummary.result?.[0];
  if (!r?.topHoldings) return null;

  const sectorWeightings = (r.topHoldings.sectorWeightings ?? []).flatMap((entry) =>
    Object.entries(entry)
      .filter(([, v]) => v !== null)
      .map(([sector, weight]) => ({ sector, weightPct: (weight as number) * 100 })),
  );

  return {
    holdings: (r.topHoldings.holdings ?? []).map((h) => ({
      symbol: h.symbol,
      name: h.holdingName ?? h.symbol,
      weightPct: (h.holdingPercent ?? 0) * 100,
    })),
    sectorWeightings,
    stockPositionPct: r.topHoldings.stockPosition !== null ? r.topHoldings.stockPosition * 100 : null,
    bondPositionPct: r.topHoldings.bondPosition !== null ? r.topHoldings.bondPosition * 100 : null,
    cashPositionPct: r.topHoldings.cashPosition !== null ? r.topHoldings.cashPosition * 100 : null,
    family: r.fundProfile?.family ?? null,
    category: r.fundProfile?.categoryName ?? null,
    legalType: r.fundProfile?.legalType ?? null,
    expenseRatio: r.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio ?? null,
    totalNetAssets: r.fundProfile?.feesExpensesInvestment?.totalNetAssets ?? null,
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

// ---------------------------------------------------------------------------
// Previsiones completas (earningsTrend, todos los períodos) — "Previsiones"
// ---------------------------------------------------------------------------

const fullEarningsTrendSchema = z.object({
  earningsTrend: z
    .object({
      trend: z.array(
        z.object({
          period: z.string(),
          endDate: z.string().nullable().optional(),
          growth: rawNum,
          earningsEstimate: z
            .object({ avg: rawNum, low: rawNum, high: rawNum, numberOfAnalysts: rawNum, growth: rawNum })
            .partial()
            .optional(),
          revenueEstimate: z
            .object({ avg: rawNum, low: rawNum, high: rawNum, numberOfAnalysts: rawNum, growth: rawNum })
            .partial()
            .optional(),
        }),
      ),
    })
    .optional(),
});

export interface ForecastPeriod {
  period: string; // "0q" | "+1q" | "0y" | "+1y"
  endDate: string | null;
  epsEstimateAvg: number | null;
  epsGrowth: number | null;
  revenueEstimateAvg: number | null;
  revenueGrowth: number | null;
  numberOfAnalysts: number | null;
}

const PERIOD_LABELS: Record<string, string> = {
  "0q": "Trimestre actual",
  "+1q": "Próximo trimestre",
  "0y": "Año fiscal actual",
  "+1y": "Próximo año fiscal",
};

export async function getEarningsForecasts(symbol: string): Promise<ForecastPeriod[]> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=earningsTrend&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(fullEarningsTrendSchema),
  );
  const trend = result.quoteSummary.result?.[0]?.earningsTrend?.trend ?? [];
  return trend
    .filter((t) => t.period in PERIOD_LABELS)
    .map((t) => ({
      period: t.period,
      endDate: t.endDate ?? null,
      epsEstimateAvg: t.earningsEstimate?.avg ?? null,
      epsGrowth: t.earningsEstimate?.growth ?? null,
      revenueEstimateAvg: t.revenueEstimate?.avg ?? null,
      revenueGrowth: t.revenueEstimate?.growth ?? null,
      numberOfAnalysts: t.earningsEstimate?.numberOfAnalysts ?? null,
    }));
}

export { PERIOD_LABELS as FORECAST_PERIOD_LABELS };

// ---------------------------------------------------------------------------
// Historial de earnings (EPS real vs. estimado, últimos trimestres) —
// "Earnings"
// ---------------------------------------------------------------------------

const earningsHistorySchema = z.object({
  earningsHistory: z
    .object({
      history: z.array(
        z.object({
          quarter: rawFmt,
          epsActual: rawNum,
          epsEstimate: rawNum,
          epsDifference: rawNum,
          surprisePercent: rawNum,
        }),
      ),
    })
    .optional(),
});

export interface EarningsHistoryQuarter {
  quarterEndDate: string | null;
  epsActual: number | null;
  epsEstimate: number | null;
  epsDifference: number | null;
  surprisePercent: number | null;
}

export async function getEarningsHistory(symbol: string): Promise<EarningsHistoryQuarter[]> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=earningsHistory&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(earningsHistorySchema),
  );
  const history = result.quoteSummary.result?.[0]?.earningsHistory?.history ?? [];
  return history.map((h) => ({
    quarterEndDate: h.quarter ?? null,
    epsActual: h.epsActual ?? null,
    epsEstimate: h.epsEstimate ?? null,
    epsDifference: h.epsDifference ?? null,
    surprisePercent: h.surprisePercent ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Estructura accionaria (majorHoldersBreakdown + institutionOwnership) —
// "Accionistas"
// ---------------------------------------------------------------------------

const shareholderSchema = z.object({
  majorHoldersBreakdown: z
    .object({
      insidersPercentHeld: rawNum,
      institutionsPercentHeld: rawNum,
      institutionsCount: rawNum,
    })
    .partial()
    .optional(),
  institutionOwnership: z
    .object({
      ownershipList: z
        .array(
          z.object({
            organization: z.string(),
            pctHeld: rawNum,
            position: rawNum,
            value: rawNum,
            reportDate: rawFmt,
          }),
        )
        .optional(),
    })
    .optional(),
});

export interface ShareholderStructure {
  insidersPct: number | null;
  institutionsPct: number | null;
  institutionsCount: number | null;
  topHolders: { organization: string; pctHeld: number | null; position: number | null; value: number | null }[];
}

export async function getShareholderStructure(symbol: string): Promise<ShareholderStructure> {
  const result = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=majorHoldersBreakdown,institutionOwnership&crumb=${encodeURIComponent(crumb)}`,
    quoteSummarySchema(shareholderSchema),
  );
  const r = result.quoteSummary.result?.[0];
  return {
    insidersPct: r?.majorHoldersBreakdown?.insidersPercentHeld ?? null,
    institutionsPct: r?.majorHoldersBreakdown?.institutionsPercentHeld ?? null,
    institutionsCount: r?.majorHoldersBreakdown?.institutionsCount ?? null,
    topHolders: (r?.institutionOwnership?.ownershipList ?? []).slice(0, 10).map((h) => ({
      organization: h.organization,
      pctHeld: h.pctHeld ?? null,
      position: h.position ?? null,
      value: h.value ?? null,
    })),
  };
}
