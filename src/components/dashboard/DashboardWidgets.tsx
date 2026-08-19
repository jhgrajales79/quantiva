"use client";

import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { WidgetCustomizePanel } from "@/components/widgets/WidgetCustomizePanel";
import { DASHBOARD_WIDGET_DEFS, DEFAULT_DASHBOARD_WIDGETS, sanitizeWidgetList } from "@/lib/dashboard-widgets";
import { WatchlistSummaryCard } from "./WatchlistSummaryCard";
import { PortfolioSummaryCard } from "./PortfolioSummaryCard";
import { NewsSummaryCard } from "./NewsSummaryCard";
import { MarketMonitorWidget } from "./MarketMonitorWidget";
import { SectorRotationWidget } from "./SectorRotationWidget";
import { FearGreedWidget } from "./FearGreedWidget";
import { MarketBreadthWidget } from "./MarketBreadthWidget";
import { MacroStrip } from "./MacroStrip";

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  watchlist: WatchlistSummaryCard,
  portfolio: PortfolioSummaryCard,
  news: NewsSummaryCard,
  market_monitor: MarketMonitorWidget,
  sector_rotation: SectorRotationWidget,
  fear_greed: FearGreedWidget,
  market_breadth: MarketBreadthWidget,
  macro: MacroStrip,
};

const WIDGET_SPAN: Record<string, "half" | "full"> = Object.fromEntries(
  DASHBOARD_WIDGET_DEFS.map((w) => [w.id, w.span]),
);

export function DashboardWidgets() {
  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/widgets")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWidgets(sanitizeWidgetList(data?.widgets)))
      .catch(() => setWidgets(DEFAULT_DASHBOARD_WIDGETS));
  }, []);

  async function handleSave(next: string[]) {
    setWidgets(next);
    setPanelOpen(false);
    setSaving(true);
    try {
      await fetch("/api/dashboard/widgets", {
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
          Personalizar panel
          {saving && <Spinner label="" className="ml-1" />}
        </button>
      </div>

      {widgets === null ? (
        <Spinner className="p-4" />
      ) : widgets.length === 0 ? (
        <p className="rounded-lg border border-app-border bg-app-surface p-6 text-center text-sm text-app-fg-muted">
          No tienes widgets activos. Usa "Personalizar panel" para agregar algunos.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {widgets.map((id) => {
            const Component = WIDGET_COMPONENTS[id];
            if (!Component) return null;
            return (
              <div key={id} className={WIDGET_SPAN[id] === "full" ? "md:col-span-2" : ""}>
                <Component />
              </div>
            );
          })}
        </div>
      )}

      {panelOpen && (
        <WidgetCustomizePanel
          title="Personalizar panel"
          description="Elige qué widgets ver en tu panel y en qué orden aparecen."
          defs={DASHBOARD_WIDGET_DEFS}
          current={widgets ?? DEFAULT_DASHBOARD_WIDGETS}
          defaultIds={DEFAULT_DASHBOARD_WIDGETS}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
