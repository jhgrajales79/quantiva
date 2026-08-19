"use client";

import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { WidgetCustomizePanel } from "@/components/widgets/WidgetCustomizePanel";
import { STOCK_WIDGET_DEFS, DEFAULT_STOCK_WIDGETS, sanitizeStockWidgetList } from "@/lib/stock-widgets";
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

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ symbol: string }>> = {
  scores: ScoresPanel,
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
};

const WIDGET_SPAN: Record<string, "half" | "full"> = Object.fromEntries(
  STOCK_WIDGET_DEFS.map((w) => [w.id, w.span]),
);

export function StockWidgets({ symbol }: { symbol: string }) {
  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stock-widgets")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWidgets(sanitizeStockWidgetList(data?.widgets)))
      .catch(() => setWidgets(DEFAULT_STOCK_WIDGETS));
  }, []);

  async function handleSave(next: string[]) {
    setWidgets(next);
    setPanelOpen(false);
    setSaving(true);
    try {
      await fetch("/api/stock-widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-app-border px-3 py-1.5 text-xs font-medium text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
        >
          <LayoutGrid size={14} strokeWidth={2} />
          Personalizar widgets
          {saving && <Spinner label="" className="ml-1" />}
        </button>
      </div>

      {widgets === null ? (
        <Spinner className="p-4" />
      ) : widgets.length === 0 ? (
        <p className="rounded-lg border border-app-border bg-app-surface p-6 text-center text-sm text-app-fg-muted">
          No tienes widgets activos. Usa "Personalizar widgets" para agregar algunos.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {widgets.map((id) => {
            const Component = WIDGET_COMPONENTS[id];
            if (!Component) return null;
            return (
              <div key={id} className={WIDGET_SPAN[id] === "full" ? "lg:col-span-2" : ""}>
                <Component symbol={symbol} />
              </div>
            );
          })}
        </div>
      )}

      {panelOpen && (
        <WidgetCustomizePanel
          title="Personalizar widgets"
          description="Elige qué información de esta acción ver y en qué orden aparece. Se aplica a cualquier ticker que visites."
          defs={STOCK_WIDGET_DEFS}
          current={widgets ?? DEFAULT_STOCK_WIDGETS}
          defaultIds={DEFAULT_STOCK_WIDGETS}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
