"use client";

import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import {
  STOCK_WIDGET_DEFS,
  DEFAULT_STOCK_WIDGETS,
  sanitizeStockWidgetList,
  sanitizeStockWidgetSizes,
} from "@/lib/stock-widgets";
import { ScoresPanel } from "./ScoresPanel";
import { PriceChartSection } from "./PriceChartSection";
import { FundamentalsMiniCards } from "./FundamentalsMiniCards";
import { EarningsRevenueCard } from "./EarningsRevenueCard";
import { ValuationVsHistoryTable } from "./ValuationVsHistoryTable";
import { ProfitabilityVsHistoryTable } from "./ProfitabilityVsHistoryTable";
import { FinancialHealthCard } from "./FinancialHealthCard";
import { DividendsCard } from "./DividendsCard";
import { FairValueModelsCard } from "./FairValueModelsCard";
import { CompanyProfileCard } from "./CompanyProfileCard";
import { AnalystConsensusCard } from "./AnalystConsensusCard";
import { NewsFilingsTabs } from "./NewsFilingsTabs";
import { SimilarCompaniesGrid } from "./SimilarCompaniesGrid";
import { EarningsHistoryCard } from "./EarningsHistoryCard";
import { ForecastsCard } from "./ForecastsCard";
import { ShareholdersCard } from "./ShareholdersCard";
import { DcfSimulatorCard } from "./DcfSimulatorCard";
import { PriceVsFairValueCard } from "./PriceVsFairValueCard";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ symbol: string }>> = {
  scores: ScoresPanel,
  price_vs_fair_value: PriceVsFairValueCard,
  price_chart: PriceChartSection,
  fundamentals: FundamentalsMiniCards,
  earnings_revenue: EarningsRevenueCard,
  valuation_vs_history: ValuationVsHistoryTable,
  profitability_vs_history: ProfitabilityVsHistoryTable,
  financial_health: FinancialHealthCard,
  dividends: DividendsCard,
  fair_value_models: FairValueModelsCard,
  company_profile: CompanyProfileCard,
  analyst_consensus: AnalystConsensusCard,
  news_filings: NewsFilingsTabs,
  similar_companies: SimilarCompaniesGrid,
  earnings_history: EarningsHistoryCard,
  forecasts: ForecastsCard,
  shareholders: ShareholdersCard,
  dcf_simulator: DcfSimulatorCard,
};

export function StockWidgets({ symbol }: { symbol: string }) {
  return (
    <WidgetGrid
      apiPath="/api/stock-widgets"
      buttonLabel="Personalizar widgets"
      panelTitle="Personalizar widgets"
      panelDescription="Elige qué información de esta acción ver y en qué orden aparece. Se aplica a cualquier ticker que visites."
      emptyMessage='No tienes widgets activos. Usa "Personalizar widgets" para agregar algunos.'
      defs={STOCK_WIDGET_DEFS}
      defaultIds={DEFAULT_STOCK_WIDGETS}
      sanitizeList={sanitizeStockWidgetList}
      sanitizeSizes={sanitizeStockWidgetSizes}
      gridClassName="lg:grid-cols-2"
      fullSpanClassName="lg:col-span-2"
      renderWidget={(id) => {
        const Component = WIDGET_COMPONENTS[id];
        if (!Component) return null;
        return <Component symbol={symbol} />;
      }}
    />
  );
}
