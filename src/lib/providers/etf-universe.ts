import { SECTOR_ETFS } from "./sector-etfs";

export interface HeatmapEtf {
  symbol: string;
  label: string;
}

// ETFs populares fuera de los 11 sectoriales SPDR (índices amplios,
// internacional, renta fija, materias primas, temáticos) — universo curado
// a mano en vez de una lista exhaustiva, para que el mapa de calor de ETFs
// tenga variedad sin requerir un proveedor de "universo completo de ETFs".
const BROAD_ETFS: HeatmapEtf[] = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "QQQ", label: "Nasdaq 100" },
  { symbol: "DIA", label: "Dow Jones" },
  { symbol: "IWM", label: "Russell 2000" },
  { symbol: "VTI", label: "Mercado total US" },
  { symbol: "VOO", label: "S&P 500 (Vanguard)" },
  { symbol: "VXUS", label: "Internacional ex-US" },
  { symbol: "VEA", label: "Mercados desarrollados" },
  { symbol: "VWO", label: "Mercados emergentes" },
  { symbol: "AGG", label: "Bonos agregados US" },
  { symbol: "TLT", label: "Bonos del Tesoro 20+ años" },
  { symbol: "GLD", label: "Oro" },
  { symbol: "SLV", label: "Plata" },
  { symbol: "USO", label: "Petróleo" },
  { symbol: "ARKK", label: "Innovación disruptiva" },
  { symbol: "SMH", label: "Semiconductores" },
  { symbol: "SCHD", label: "Dividendos de calidad" },
];

export const ETF_UNIVERSE: HeatmapEtf[] = [
  ...SECTOR_ETFS.map((e) => ({ symbol: e.symbol, label: e.label })),
  ...BROAD_ETFS,
];
