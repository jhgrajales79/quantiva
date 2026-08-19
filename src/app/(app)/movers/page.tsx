"use client";

import { useEffect, useState } from "react";
import { MoversTable } from "@/components/market/MoversTable";
import { Spinner } from "@/components/ui/Spinner";
import { TrendingUp } from "lucide-react";

interface MoversResponse {
  gainers: { symbol: string; name: string; changePct: number | null; volume: number | null }[];
  losers: { symbol: string; name: string; changePct: number | null; volume: number | null }[];
  mostActive: { symbol: string; name: string; changePct: number | null; volume: number | null }[];
}

export default function MoversPage() {
  const [data, setData] = useState<MoversResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/movers")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Dato no disponible");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
        <TrendingUp size={20} strokeWidth={2} />
        Market Movers
      </h1>
      {error && <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>}
      {!data && !error && <Spinner />}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <MoversTable title="Top Gainers" rows={data.gainers} />
          <MoversTable title="Top Losers" rows={data.losers} />
          <MoversTable title="Most Active" rows={data.mostActive} />
        </div>
      )}
    </div>
  );
}
