import { sanitizeWidgetList as sanitize } from "@/lib/widget-list";

export interface DashboardWidgetDef {
  id: string;
  label: string;
  description: string;
  span: "half" | "full";
}

export const DASHBOARD_WIDGET_DEFS: DashboardWidgetDef[] = [
  { id: "watchlist", label: "Watchlist", description: "Resumen de las acciones que sigues.", span: "half" },
  { id: "portfolio", label: "Mi portafolio", description: "Valor, ganancia y número de carteras.", span: "half" },
  { id: "news", label: "Noticias", description: "Últimas noticias de tus acciones seguidas.", span: "half" },
  { id: "market_monitor", label: "Mercado", description: "Índices, cripto, materias primas y divisas.", span: "full" },
  { id: "sector_rotation", label: "Rotación sectorial", description: "Desempeño de los 11 sectores del S&P 500.", span: "full" },
  { id: "fear_greed", label: "Miedo y codicia", description: "Índice de sentimiento de mercado (CNN).", span: "half" },
  { id: "market_breadth", label: "Amplitud del mercado", description: "Avances/declives y % sobre medias móviles del S&P 500.", span: "half" },
  { id: "macro", label: "Panorama macro", description: "Inflación, PIB, desempleo y tasa de la Fed (FRED).", span: "full" },
];

export const DASHBOARD_WIDGET_IDS = DASHBOARD_WIDGET_DEFS.map((w) => w.id);

export const DEFAULT_DASHBOARD_WIDGETS = [...DASHBOARD_WIDGET_IDS];

export function sanitizeWidgetList(input: unknown): string[] {
  return sanitize(input, DASHBOARD_WIDGET_IDS, DEFAULT_DASHBOARD_WIDGETS);
}
