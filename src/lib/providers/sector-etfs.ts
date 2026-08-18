export interface SectorEtf {
  symbol: string;
  label: string;
}

// Los 11 ETFs sectoriales SPDR replican los 11 sectores del S&P 500 (§8.1
// del plan original) — es el proxy estándar de la industria para "rotación
// sectorial" cuando no se tiene acceso a un índice de sector propietario.
export const SECTOR_ETFS: SectorEtf[] = [
  { symbol: "XLK", label: "Tecnología" },
  { symbol: "XLV", label: "Salud" },
  { symbol: "XLF", label: "Finanzas" },
  { symbol: "XLY", label: "Consumo cíclico" },
  { symbol: "XLC", label: "Comunicación" },
  { symbol: "XLI", label: "Industria" },
  { symbol: "XLP", label: "Consumo defensivo" },
  { symbol: "XLE", label: "Energía" },
  { symbol: "XLU", label: "Servicios públicos" },
  { symbol: "XLRE", label: "Inmobiliario" },
  { symbol: "XLB", label: "Materiales" },
];
