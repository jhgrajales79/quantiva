import { valueDcf } from "./dcf";
import { valuePeRelative } from "./pe-relative";
import { valueEvEbitda } from "./ev-ebitda";
import { valuePs } from "./ps";
import { valueGraham } from "./graham";
import { computeConsensus, valuationBadge, type ValuationBadge } from "./consensus";
import {
  computeValueScore,
  computeQualityScore,
  computeGrowthScore,
  computeMomentumScore,
  computeInvestmentScore,
  isPossibleValueTrap,
} from "./scores";
import type { RatiosSnapshot, ValuationResult } from "./types";

export interface EvaluateAssetInput {
  currentPrice: number;
  eps: number | null;
  revenue: number | null;
  ebitda: number | null;
  fcf: number | null;
  totalDebt: number | null;
  cash: number | null;
  sharesOutstanding: number | null;
  bookValuePerShare: number | null;
  beta: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  roe: number | null;
  roic: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  debtToEbitda: number | null;
  fcfYield: number | null;
  dividendYield: number | null;
  riskFreeRate: number | null;
  historicalRatios: RatiosSnapshot[];
  performance: {
    perf1m: number | null;
    perf3m: number | null;
    perf6m: number | null;
    perf12m: number | null;
    priceVsMa50Pct: number | null;
    priceVsMa200Pct: number | null;
  };
}

export interface EvaluateAssetResult {
  models: ValuationResult[];
  fairValueConsensus: number | null;
  upsidePct: number | null;
  marginOfSafetyPrice: number | null;
  badge: ValuationBadge | null;
  valueScore: number | null;
  qualityScore: number | null;
  growthScore: number | null;
  momentumScore: number | null;
  investmentScore: number | null;
  possibleValueTrap: boolean;
}

export function evaluateAsset(input: EvaluateAssetInput): EvaluateAssetResult {
  const models: ValuationResult[] = [
    valueDcf({
      fcf: input.fcf,
      revenueGrowth: input.revenueGrowth,
      beta: input.beta,
      totalDebt: input.totalDebt,
      cash: input.cash,
      sharesOutstanding: input.sharesOutstanding,
      riskFreeRate: input.riskFreeRate,
    }),
    valuePeRelative(input.eps, input.historicalRatios),
    valueEvEbitda(
      input.ebitda,
      input.totalDebt,
      input.cash,
      input.sharesOutstanding,
      input.historicalRatios,
    ),
    valuePs(input.revenue, input.sharesOutstanding, input.historicalRatios),
    valueGraham(input.eps, input.bookValuePerShare),
  ];

  const consensus = computeConsensus(models, input.currentPrice);
  const badge = valuationBadge(consensus.upsidePct);

  const valueScore = computeValueScore({
    upsidePct: consensus.upsidePct,
    fcfYield: input.fcfYield,
    dividendYield: input.dividendYield,
  });
  const qualityScore = computeQualityScore({
    roe: input.roe,
    roic: input.roic,
    grossMargin: input.grossMargin,
    operatingMargin: input.operatingMargin,
    debtToEbitda: input.debtToEbitda,
  });
  const growthScore = computeGrowthScore({
    revenueGrowth: input.revenueGrowth,
    epsGrowth: input.epsGrowth,
  });
  const momentumScore = computeMomentumScore(input.performance);
  const investmentScore = computeInvestmentScore({
    valueScore,
    qualityScore,
    growthScore,
    momentumScore,
  });

  const possibleValueTrap = isPossibleValueTrap({
    upsidePct: consensus.upsidePct,
    revenueGrowth: input.revenueGrowth,
    fcf: input.fcf,
    debtToEbitda: input.debtToEbitda,
  });

  return {
    models,
    fairValueConsensus: consensus.fairValueConsensus,
    upsidePct: consensus.upsidePct,
    marginOfSafetyPrice: consensus.marginOfSafetyPrice,
    badge,
    valueScore,
    qualityScore,
    growthScore,
    momentumScore,
    investmentScore,
    possibleValueTrap,
  };
}
