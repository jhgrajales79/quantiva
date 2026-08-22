"use client";

import { WidgetGrid } from "@/components/widgets/WidgetGrid";
import {
  DASHBOARD_WIDGET_DEFS,
  DEFAULT_DASHBOARD_WIDGETS,
  sanitizeWidgetList,
  sanitizeDashboardWidgetLayout,
} from "@/lib/dashboard-widgets";
import { WatchlistSummaryCard } from "./WatchlistSummaryCard";
import { PortfolioSummaryCard } from "./PortfolioSummaryCard";
import { NewsSummaryCard } from "./NewsSummaryCard";
import { MarketMonitorWidget } from "./MarketMonitorWidget";
import { SectorRotationWidget } from "./SectorRotationWidget";
import { FearGreedWidget } from "./FearGreedWidget";
import { MarketBreadthWidget } from "./MarketBreadthWidget";
import { MacroStrip } from "./MacroStrip";
import { AnalystHighlightsWidget } from "./AnalystHighlightsWidget";

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  watchlist: WatchlistSummaryCard,
  portfolio: PortfolioSummaryCard,
  news: NewsSummaryCard,
  market_monitor: MarketMonitorWidget,
  sector_rotation: SectorRotationWidget,
  fear_greed: FearGreedWidget,
  market_breadth: MarketBreadthWidget,
  macro: MacroStrip,
  analyst_highlights: AnalystHighlightsWidget,
};

export function DashboardWidgets() {
  return (
    <WidgetGrid
      apiPath="/api/dashboard/widgets"
      buttonLabel="Personalizar panel"
      panelTitle="Personalizar panel"
      panelDescription="Elige qué widgets ver en tu panel y en qué orden aparecen."
      emptyMessage='No tienes widgets activos. Usa "Personalizar panel" para agregar algunos.'
      defs={DASHBOARD_WIDGET_DEFS}
      defaultIds={DEFAULT_DASHBOARD_WIDGETS}
      sanitizeList={sanitizeWidgetList}
      sanitizeLayout={sanitizeDashboardWidgetLayout}
      renderWidget={(id) => {
        const Component = WIDGET_COMPONENTS[id];
        if (!Component) return null;
        return <Component />;
      }}
    />
  );
}
