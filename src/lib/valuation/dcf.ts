import type { ValuationResult } from "./types";

const DEFAULT_EQUITY_RISK_PREMIUM = 0.045; // supuesto de mercado estándar, documentado explícitamente
const DEFAULT_TERMINAL_GROWTH = 0.025;
const DEFAULT_PROJECTION_YEARS = 5;

export interface DcfInputs {
  fcf: number | null;
  revenueGrowth: number | null; // usado como proxy de crecimiento del FCF proyectado
  beta: number | null;
  totalDebt: number | null;
  cash: number | null;
  sharesOutstanding: number | null;
  riskFreeRate: number | null; // Treasury 10Y, de FRED
  terminalGrowth?: number;
  equityRiskPremium?: number;
  projectionYears?: number;
}

/**
 * DCF simplificado: FCF creciendo a una tasa constante (proxy: revenue growth)
 * durante `projectionYears`, valor terminal por Gordon Growth, descontado a
 * WACC aproximado por CAPM (costo de deuda no modelado explícitamente — se
 * documenta como supuesto). Nunca corre si falta FCF, beta, riskFreeRate o
 * acciones en circulación: no se inventan sustitutos silenciosos.
 */
export function valueDcf(inputs: DcfInputs): ValuationResult {
  const {
    fcf,
    revenueGrowth,
    beta,
    totalDebt,
    cash,
    sharesOutstanding,
    riskFreeRate,
    terminalGrowth = DEFAULT_TERMINAL_GROWTH,
    equityRiskPremium = DEFAULT_EQUITY_RISK_PREMIUM,
    projectionYears = DEFAULT_PROJECTION_YEARS,
  } = inputs;

  if (fcf === null || fcf <= 0) {
    return {
      model: "dcf",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: Free Cash Flow no disponible o negativo.",
    };
  }
  if (sharesOutstanding === null || sharesOutstanding <= 0) {
    return {
      model: "dcf",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: acciones en circulación no disponibles.",
    };
  }
  if (riskFreeRate === null) {
    return {
      model: "dcf",
      fairValue: null,
      assumptions: {},
      unavailableReason: "Dato no disponible: tasa libre de riesgo (Treasury 10Y) no disponible.",
    };
  }

  const effectiveBeta = beta ?? 1;
  const wacc = riskFreeRate + effectiveBeta * equityRiskPremium;

  if (wacc <= terminalGrowth) {
    return {
      model: "dcf",
      fairValue: null,
      assumptions: { wacc, terminalGrowth },
      unavailableReason:
        "Dato no disponible: WACC calculado es menor o igual al crecimiento terminal, el modelo no converge.",
    };
  }

  const growthRate = revenueGrowth ?? 0;

  let presentValueSum = 0;
  let projectedFcf = fcf;
  for (let year = 1; year <= projectionYears; year += 1) {
    projectedFcf *= 1 + growthRate;
    presentValueSum += projectedFcf / Math.pow(1 + wacc, year);
  }

  const terminalValue =
    (projectedFcf * (1 + terminalGrowth)) / (wacc - terminalGrowth);
  const discountedTerminalValue = terminalValue / Math.pow(1 + wacc, projectionYears);

  const enterpriseValue = presentValueSum + discountedTerminalValue;
  const netDebt = (totalDebt ?? 0) - (cash ?? 0);
  const equityValue = enterpriseValue - netDebt;
  const fairValue = equityValue / sharesOutstanding;

  return {
    model: "dcf",
    fairValue,
    assumptions: {
      fcfYear0: fcf,
      growthRateUsed: growthRate,
      beta: effectiveBeta,
      riskFreeRate,
      equityRiskPremium,
      wacc,
      terminalGrowth,
      projectionYears,
      enterpriseValue,
      netDebt,
      sharesOutstanding,
      note:
        beta === null
          ? "Beta no disponible del proveedor: se usó beta=1 (mercado) como supuesto explícito."
          : undefined,
    },
    unavailableReason: null,
  };
}
