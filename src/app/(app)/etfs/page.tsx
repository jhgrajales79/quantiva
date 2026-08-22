"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { PieChart, SearchX } from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string | null;
  assetType: "stock" | "etf" | "crypto";
}

export default function EtfsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = res.ok ? await res.json() : null;
      const all: SearchResult[] = data?.results ?? [];
      setResults(all.filter((r) => r.assetType === "etf"));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={PieChart}
        title="ETFs"
        description="Busca un ETF por símbolo o nombre para ver su composición, sectores y ficha técnica."
      />

      <Card>
        <input
          type="text"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Ej. VTI, QQQ, SPY, ARKK..."
          className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg outline-none focus:border-brand"
        />
      </Card>

      <Card padded={false}>
        {loading ? (
          <SkeletonText lines={4} className="p-4" />
        ) : results === null ? (
          <EmptyState icon={PieChart} message="Escribe para buscar un ETF." />
        ) : results.length === 0 ? (
          <EmptyState icon={SearchX} message={`Sin resultados para "${query}".`} />
        ) : (
          <ul className="divide-y divide-app-border">
            {results.map((r) => (
              <li key={r.symbol}>
                <Link
                  href={`/etfs/${r.symbol}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-app-surface-2"
                >
                  <div>
                    <p className="text-sm font-medium text-app-fg">{r.symbol}</p>
                    <p className="text-xs text-app-fg-muted">{r.name}</p>
                  </div>
                  <span className="text-xs text-app-fg-faint">{r.exchange ?? ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
