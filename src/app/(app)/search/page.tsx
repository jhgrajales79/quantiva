"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { Search } from "lucide-react";

interface SymbolMatch {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SymbolMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Dato no disponible");
        return data;
      })
      .then((data) => setResults(data.results))
      .catch((err) => setError(err.message));
  }, [q]);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
        <Search size={20} strokeWidth={2} />
        Buscar
      </h1>
      {!q && <p className="text-sm text-app-fg-muted">Escribe un ticker o nombre en el buscador.</p>}
      {error && <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>}
      {results && results.length === 0 && q && (
        <p className="text-sm text-app-fg-muted">Sin resultados para &quot;{q}&quot;.</p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y divide-app-border rounded-lg border border-app-border bg-app-surface">
          {results.map((r) => (
            <li key={r.symbol}>
              <Link
                href={`/stocks/${r.symbol}`}
                className="flex items-center justify-between p-3 hover:bg-app-surface-2/50"
              >
                <span>
                  <span className="font-medium text-app-fg">{r.symbol}</span>
                  <span className="ml-2 text-sm text-app-fg-muted">{r.name}</span>
                </span>
                <span className="text-xs text-app-fg-muted">{r.exchange}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
