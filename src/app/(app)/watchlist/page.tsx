import { WatchlistTable } from "@/components/tables/WatchlistTable";

export default function WatchlistPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-app-fg">Watchlist</h1>
      <WatchlistTable />
    </div>
  );
}
