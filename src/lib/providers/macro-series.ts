export interface MacroSeriesDefinition {
  code: string;
  label: string;
  unit: string;
}

// FRED series codes used by the Macro Dashboard (MVP subset — §11 del spec).
export const MACRO_SERIES: MacroSeriesDefinition[] = [
  { code: "CPIAUCSL", label: "CPI (Inflación)", unit: "index" },
  { code: "CPILFESL", label: "Core CPI", unit: "index" },
  { code: "GDPC1", label: "PIB real", unit: "billions USD" },
  { code: "UNRATE", label: "Desempleo", unit: "%" },
  { code: "PAYEMS", label: "Non-Farm Payrolls", unit: "thousands" },
  { code: "FEDFUNDS", label: "Fed Funds Rate (efectiva)", unit: "%" },
  // Límite superior del rango objetivo fijado por el FOMC — lo que la
  // prensa reporta como "la tasa de la Fed" tras cada reunión. Distinto de
  // FEDFUNDS (la tasa efectiva a la que de verdad se presta overnight en el
  // mercado, que flota dentro del rango objetivo y no coincide con él).
  { code: "DFEDTARU", label: "Fed Funds Target Rate (superior)", unit: "%" },
  { code: "DGS2", label: "Treasury 2Y", unit: "%" },
  { code: "DGS10", label: "Treasury 10Y", unit: "%" },
  { code: "UMCSENT", label: "Consumer Sentiment", unit: "index" },
  { code: "HOUST", label: "Housing Starts", unit: "thousands" },
  { code: "RSAFS", label: "Retail Sales", unit: "millions USD" },
];
