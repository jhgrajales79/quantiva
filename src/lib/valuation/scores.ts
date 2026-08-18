function clampScale(value: number, min: number, max: number): number {
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}

function weightedAverage(
  components: { value: number | null; weight: number }[],
): number | null {
  const available = components.filter(
    (c): c is { value: number; weight: number } => c.value !== null,
  );
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  const weighted = available.reduce((sum, c) => sum + c.value * c.weight, 0);
  return weighted / totalWeight;
}

// ---------------------------------------------------------------------------
// Value Score — §20: qué tan barata está la acción vs. su propio historial.
// ---------------------------------------------------------------------------

export interface ValueScoreInputs {
  upsidePct: number | null; // del Fair Value Consensus
  fcfYield: number | null;
  dividendYield: number | null;
}

export function computeValueScore(inputs: ValueScoreInputs): number | null {
  return weightedAverage([
    { value: inputs.upsidePct === null ? null : clampScale(inputs.upsidePct, -0.3, 0.5), weight: 0.6 },
    { value: inputs.fcfYield === null ? null : clampScale(inputs.fcfYield, 0, 0.1), weight: 0.3 },
    {
      value: inputs.dividendYield === null ? null : clampScale(inputs.dividendYield, 0, 0.06),
      weight: 0.1,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Quality Score — §21: rentabilidad y solidez financiera.
// ---------------------------------------------------------------------------

export interface QualityScoreInputs {
  roe: number | null;
  roic: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  debtToEbitda: number | null;
}

export function computeQualityScore(inputs: QualityScoreInputs): number | null {
  return weightedAverage([
    { value: inputs.roe === null ? null : clampScale(inputs.roe, 0, 0.3), weight: 0.25 },
    { value: inputs.roic === null ? null : clampScale(inputs.roic, 0, 0.2), weight: 0.25 },
    {
      value: inputs.grossMargin === null ? null : clampScale(inputs.grossMargin, 0, 0.6),
      weight: 0.2,
    },
    {
      value:
        inputs.operatingMargin === null ? null : clampScale(inputs.operatingMargin, 0, 0.3),
      weight: 0.15,
    },
    {
      // deuda alta = peor calidad, por eso se invierte la escala
      value: inputs.debtToEbitda === null ? null : 100 - clampScale(inputs.debtToEbitda, 0, 5),
      weight: 0.15,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Growth Score — §22 (versión reducida del MVP).
// ---------------------------------------------------------------------------

export interface GrowthScoreInputs {
  revenueGrowth: number | null;
  epsGrowth: number | null;
}

export function computeGrowthScore(inputs: GrowthScoreInputs): number | null {
  return weightedAverage([
    {
      value: inputs.revenueGrowth === null ? null : clampScale(inputs.revenueGrowth, -0.1, 0.3),
      weight: 0.5,
    },
    { value: inputs.epsGrowth === null ? null : clampScale(inputs.epsGrowth, -0.1, 0.3), weight: 0.5 },
  ]);
}

// ---------------------------------------------------------------------------
// Momentum Score — §23.
// ---------------------------------------------------------------------------

export interface MomentumScoreInputs {
  perf1m: number | null;
  perf3m: number | null;
  perf6m: number | null;
  perf12m: number | null;
  priceVsMa50Pct: number | null;
  priceVsMa200Pct: number | null;
}

export function computeMomentumScore(inputs: MomentumScoreInputs): number | null {
  return weightedAverage([
    { value: inputs.perf1m === null ? null : clampScale(inputs.perf1m, -0.15, 0.15), weight: 0.15 },
    { value: inputs.perf3m === null ? null : clampScale(inputs.perf3m, -0.2, 0.2), weight: 0.2 },
    { value: inputs.perf6m === null ? null : clampScale(inputs.perf6m, -0.25, 0.25), weight: 0.2 },
    { value: inputs.perf12m === null ? null : clampScale(inputs.perf12m, -0.3, 0.3), weight: 0.2 },
    {
      value: inputs.priceVsMa50Pct === null ? null : clampScale(inputs.priceVsMa50Pct, -0.1, 0.1),
      weight: 0.125,
    },
    {
      value:
        inputs.priceVsMa200Pct === null ? null : clampScale(inputs.priceVsMa200Pct, -0.15, 0.15),
      weight: 0.125,
    },
  ]);
}

// ---------------------------------------------------------------------------
// Investment Score — §24. Pesos originales del spec (30/25/20/15/10, Risk
// fuera del MVP) renormalizados sobre los 4 scores disponibles.
// ---------------------------------------------------------------------------

export interface InvestmentScoreInputs {
  valueScore: number | null;
  qualityScore: number | null;
  growthScore: number | null;
  momentumScore: number | null;
}

export function computeInvestmentScore(inputs: InvestmentScoreInputs): number | null {
  return weightedAverage([
    { value: inputs.valueScore, weight: 0.3 },
    { value: inputs.qualityScore, weight: 0.25 },
    { value: inputs.growthScore, weight: 0.2 },
    { value: inputs.momentumScore, weight: 0.15 },
  ]);
}

// ---------------------------------------------------------------------------
// Value Trap — §21: precio barato pero fundamentales deteriorados.
// ---------------------------------------------------------------------------

export interface ValueTrapInputs {
  upsidePct: number | null;
  revenueGrowth: number | null;
  fcf: number | null;
  debtToEbitda: number | null;
}

export function isPossibleValueTrap(inputs: ValueTrapInputs): boolean {
  const looksCheap = inputs.upsidePct !== null && inputs.upsidePct >= 0.25;
  if (!looksCheap) return false;

  const decliningRevenue = inputs.revenueGrowth !== null && inputs.revenueGrowth < 0;
  const negativeFcf = inputs.fcf !== null && inputs.fcf < 0;
  const highDebt = inputs.debtToEbitda !== null && inputs.debtToEbitda > 4;

  return decliningRevenue || negativeFcf || highDebt;
}
