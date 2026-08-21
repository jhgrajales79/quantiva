import type { ValuationResult } from "./types";

const DEFAULT_EQUITY_RISK_PREMIUM = 0.045; // supuesto de mercado estándar, documentado explícitamente
const DEFAULT_TERMINAL_GROWTH = 0.025;
const DEFAULT_PROJECTION_YEARS = 5;

// El revenue growth YoY más reciente puede reflejar un evento puntual (una
// adquisición, una base de comparación baja) que no es sostenible 5 años
// seguidos — proyectarlo sin límite compone un FCF final varias veces mayor
// al real. Se capa a una tasa de crecimiento orgánico "alto pero creíble".
const MAX_PROJECTED_GROWTH_RATE = 0.2;

// Cuando el WACC calculado por CAPM queda casi pegado al crecimiento
// terminal (típico con betas muy bajos), el denominador de Gordon Growth
// (wacc - terminalGrowth) se acerca a cero y el valor terminal se dispara a
// magnitudes sin sentido económico. Se exige un colchón mínimo entre ambos.
const MIN_WACC_TERMINAL_SPREAD = 0.035;

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
  const rawWacc = riskFreeRate + effectiveBeta * equityRiskPremium;
  const waccFloored = rawWacc - terminalGrowth < MIN_WACC_TERMINAL_SPREAD;
  const wacc = waccFloored ? terminalGrowth + MIN_WACC_TERMINAL_SPREAD : rawWacc;

  const rawGrowthRate = revenueGrowth ?? 0;
  const growthCapped = rawGrowthRate > MAX_PROJECTED_GROWTH_RATE;
  const growthRate = growthCapped ? MAX_PROJECTED_GROWTH_RATE : rawGrowthRate;

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

  const notes: string[] = [];
  if (beta === null) {
    notes.push("Beta no disponible del proveedor: se usó beta=1 (mercado) como supuesto explícito.");
  }
  if (growthCapped) {
    notes.push(
      `Crecimiento proyectado capado de ${(rawGrowthRate * 100).toFixed(1)}% a ${(MAX_PROJECTED_GROWTH_RATE * 100).toFixed(0)}% anual: el dato del proveedor refleja un salto puntual (ej. una adquisición), no una tasa sostenible por 5 años.`,
    );
  }
  if (waccFloored) {
    notes.push(
      `WACC ajustado de ${(rawWacc * 100).toFixed(2)}% a ${(wacc * 100).toFixed(2)}% para mantener un colchón mínimo de ${(MIN_WACC_TERMINAL_SPREAD * 100).toFixed(1)} pp sobre el crecimiento terminal (beta muy bajo hacía que el valor terminal se disparara).`,
    );
  }

  return {
    model: "dcf",
    fairValue,
    assumptions: {
      fcfYear0: fcf,
      growthRateUsed: growthRate,
      rawGrowthRate,
      growthCapped,
      beta: effectiveBeta,
      riskFreeRate,
      equityRiskPremium,
      rawWacc,
      wacc,
      waccFloored,
      terminalGrowth,
      projectionYears,
      enterpriseValue,
      netDebt,
      sharesOutstanding,
      note: notes.length > 0 ? notes.join(" ") : undefined,
    },
    unavailableReason: null,
  };
}
