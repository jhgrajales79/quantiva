export interface MarketSymbol {
  symbol: string;
  label: string;
}

// Proxies vía ETFs/tickers líquidos: los símbolos de índice varían por
// proveedor, así que se usan ETFs que replican cada referencia en vez de
// inventar acceso a datos de índice no confirmados. Compartido entre
// /markets y el widget de mercado del dashboard para no duplicar listas.
export const US_SYMBOLS: MarketSymbol[] = [
  { symbol: "SPY", label: "S&P 500 (SPY)" },
  { symbol: "QQQ", label: "Nasdaq 100 (QQQ)" },
  { symbol: "DIA", label: "Dow Jones (DIA)" },
  { symbol: "IWM", label: "Russell 2000 (IWM)" },
];

export const GLOBAL_SYMBOLS: MarketSymbol[] = [
  { symbol: "ACWI", label: "MSCI World (ACWI)" },
  { symbol: "EEM", label: "MSCI Emerging Markets (EEM)" },
  { symbol: "VGK", label: "Europa (VGK)" },
  { symbol: "VPL", label: "Asia-Pacífico (VPL)" },
  { symbol: "ILF", label: "Latinoamérica (ILF)" },
];

export const COMMODITY_SYMBOLS: MarketSymbol[] = [
  { symbol: "GLD", label: "Oro (GLD)" },
  { symbol: "SLV", label: "Plata (SLV)" },
  { symbol: "USO", label: "Petróleo WTI (USO)" },
  { symbol: "UNG", label: "Gas Natural (UNG)" },
  { symbol: "CPER", label: "Cobre (CPER)" },
];

// Pares FX vía el formato de Yahoo Finance (sufijo =X). COP=X es USD/COP
// directo (Yahoo cotiza el par como unidades de la segunda moneda por 1
// USD para estos pares "USD base").
export const FX_PAIRS: MarketSymbol[] = [
  { symbol: "COP=X", label: "USD/COP" },
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "GBPUSD=X", label: "GBP/USD" },
  { symbol: "JPY=X", label: "USD/JPY" },
  { symbol: "CNY=X", label: "USD/CNY" },
];
