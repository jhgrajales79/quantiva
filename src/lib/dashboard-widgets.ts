import {
  sanitizeWidgetList as sanitize,
  sanitizeWidgetLayout,
  type GridLayoutItem,
} from "@/lib/widget-list";

export interface DashboardWidgetDef {
  id: string;
  label: string;
  description: string;
  span: "half" | "full";
  defaultH: number;
  // Ancho mínimo en columnas (de GRID_COLS) para widgets que necesitan un
  // mínimo de espacio horizontal para mostrar su contenido sin que se
  // superponga o corte — evita que el usuario los reduzca a un tamaño
  // inutilizable al redimensionar.
  minW?: number;
}

export const DASHBOARD_WIDGET_DEFS: DashboardWidgetDef[] = [
  { id: "watchlist", label: "Watchlist", description: "Resumen de las acciones que sigues.", span: "half", defaultH: 5 },
  { id: "portfolio", label: "Mi portafolio", description: "Valor, ganancia y número de carteras.", span: "half", defaultH: 5 },
  { id: "news", label: "Noticias", description: "Últimas noticias de tus acciones seguidas.", span: "half", defaultH: 5 },
  { id: "market_monitor", label: "Mercado", description: "Índices, cripto, materias primas y divisas.", span: "full", defaultH: 6, minW: 10 },
  { id: "sector_rotation", label: "Rotación sectorial", description: "Desempeño de los 11 sectores del S&P 500.", span: "full", defaultH: 7, minW: 10 },
  { id: "fear_greed", label: "Miedo y codicia", description: "Índice de sentimiento de mercado (CNN).", span: "half", defaultH: 6 },
  { id: "market_breadth", label: "Amplitud del mercado", description: "Avances/declives y % sobre medias móviles del S&P 500.", span: "half", defaultH: 6 },
  { id: "macro", label: "Panorama macro", description: "Inflación, PIB, desempleo y tasa de la Fed (FRED).", span: "full", defaultH: 4 },
];

export const DASHBOARD_WIDGET_IDS = DASHBOARD_WIDGET_DEFS.map((w) => w.id);

export const DEFAULT_DASHBOARD_WIDGETS = [...DASHBOARD_WIDGET_IDS];

export function sanitizeWidgetList(input: unknown): string[] {
  return sanitize(input, DASHBOARD_WIDGET_IDS, DEFAULT_DASHBOARD_WIDGETS);
}

export function sanitizeDashboardWidgetLayout(input: unknown): GridLayoutItem[] {
  return sanitizeWidgetLayout(input, DASHBOARD_WIDGET_IDS);
}
