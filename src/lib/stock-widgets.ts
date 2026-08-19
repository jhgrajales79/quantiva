import { sanitizeWidgetList as sanitize } from "@/lib/widget-list";

export interface StockWidgetDef {
  id: string;
  label: string;
  description: string;
  span: "half" | "full";
}

export const STOCK_WIDGET_DEFS: StockWidgetDef[] = [
  { id: "scores", label: "Puntajes de inversión", description: "Investment/Valor/Calidad/Crecimiento/Momentum.", span: "full" },
  { id: "price_chart", label: "Precio de la acción", description: "Con comparativo indexado vs. S&P 500 (SPY).", span: "full" },
  { id: "fundamentals", label: "Ingresos, utilidad, EPS y FCF", description: "Con tendencia de los últimos años.", span: "full" },
  { id: "earnings_revenue", label: "Beneficios e ingresos", description: "Desglose Ingresos → Beneficio bruto → Beneficios.", span: "full" },
  { id: "valuation_vs_history", label: "Valoración vs. histórico propio", description: "P/E, EV/EBITDA, P/S, P/Book vs. tu propio promedio.", span: "half" },
  { id: "profitability_vs_history", label: "Rentabilidad vs. histórico propio", description: "ROE, ROIC, márgenes vs. tu propio promedio.", span: "half" },
  { id: "financial_health", label: "Salud financiera", description: "Deuda, caja y liquidez.", span: "half" },
  { id: "dividends", label: "Dividendos", description: "DPS, yield y CAGR de dividendos.", span: "half" },
  { id: "fair_value_models", label: "Modelos de Fair Value", description: "DCF, P/E relativo, EV/EBITDA, P/S, Graham.", span: "full" },
  { id: "company_profile", label: "Perfil de la empresa", description: "Sector, industria, empleados, descripción.", span: "full" },
  { id: "analyst_consensus", label: "Consenso de analistas", description: "Recomendaciones y precio objetivo.", span: "half" },
  { id: "news_filings", label: "Noticias y reportes SEC", description: "Noticias recientes y filings.", span: "half" },
  { id: "similar_companies", label: "Empresas similares", description: "Comparables del mismo sector.", span: "full" },
];

export const STOCK_WIDGET_IDS = STOCK_WIDGET_DEFS.map((w) => w.id);

export const DEFAULT_STOCK_WIDGETS = [...STOCK_WIDGET_IDS];

export function sanitizeStockWidgetList(input: unknown): string[] {
  return sanitize(input, STOCK_WIDGET_IDS, DEFAULT_STOCK_WIDGETS);
}
