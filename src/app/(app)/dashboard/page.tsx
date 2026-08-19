import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { WatchlistSummaryCard } from "@/components/dashboard/WatchlistSummaryCard";
import { PortfolioSummaryCard } from "@/components/dashboard/PortfolioSummaryCard";
import { NewsSummaryCard } from "@/components/dashboard/NewsSummaryCard";
import { MarketMonitorWidget } from "@/components/dashboard/MarketMonitorWidget";
import { SectorRotationWidget } from "@/components/dashboard/SectorRotationWidget";
import { FearGreedWidget } from "@/components/dashboard/FearGreedWidget";
import { MarketBreadthWidget } from "@/components/dashboard/MarketBreadthWidget";
import { MacroStrip } from "@/components/dashboard/MacroStrip";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <GreetingHeader />

      <div className="grid gap-4 md:grid-cols-2">
        <WatchlistSummaryCard />
        <PortfolioSummaryCard />
      </div>

      <NewsSummaryCard />

      <MarketMonitorWidget />

      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-app-fg-muted">
          Pulso del mercado
        </h2>
        <SectorRotationWidget />
        <div className="grid gap-4 md:grid-cols-2">
          <FearGreedWidget />
          <MarketBreadthWidget />
        </div>
      </div>

      <MacroStrip />
    </div>
  );
}
