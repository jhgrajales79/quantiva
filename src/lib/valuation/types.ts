export type ValuationModel =
  | "dcf"
  | "pe_relative"
  | "ev_ebitda"
  | "ps"
  | "graham";

export interface ValuationResult {
  model: ValuationModel;
  fairValue: number | null;
  assumptions: Record<string, unknown>;
  unavailableReason: string | null; // set instead of a fabricated fairValue when inputs are missing
}

export interface FundamentalsInput {
  eps: number | null;
  revenue: number | null;
  ebitda: number | null;
  fcf: number | null;
  totalDebt: number | null;
  cash: number | null;
  sharesOutstanding: number | null;
  bookValuePerShare: number | null;
  beta: number | null;
}

export interface RatiosSnapshot {
  fiscalDate: string;
  pe: number | null;
  ps: number | null;
  evEbitda: number | null;
  revenueGrowth: number | null;
}

export interface DcfAssumptions {
  revenueGrowthYear1: number;
  fcfMargin: number;
  wacc: number;
  terminalGrowth: number;
  projectionYears: number;
  riskFreeRate: number;
  equityRiskPremium: number;
  beta: number;
}
