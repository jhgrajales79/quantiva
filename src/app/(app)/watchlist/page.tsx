import { WatchlistTable } from "@/components/tables/WatchlistTable";
import { Eye } from "lucide-react";

export default function WatchlistPage() {
  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
        <Eye size={20} strokeWidth={2} />
        Watchlist
      </h1>
      <WatchlistTable />
    </div>
  );
}
