"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { PieChart } from "lucide-react";

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
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
          <PieChart size={20} strokeWidth={2} />
          ETFs
        </h1>
        <p className="text-sm text-app-fg-muted">
          Busca un ETF por símbolo o nombre para ver su composición, sectores y ficha técnica.
        </p>
      </div>

      <Card>
        <input
          type="text"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Ej. VTI, QQQ, SPY, ARKK..."
          className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg"
        />
      </Card>

      <Card padded={false}>
        {loading ? (
          <p className="p-4 text-sm text-app-fg-muted">Buscando...</p>
        ) : results === null ? (
          <p className="p-4 text-sm text-app-fg-muted">Escribe para buscar un ETF.</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-app-fg-muted">Sin resultados para "{query}".</p>
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
