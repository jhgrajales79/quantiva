"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SymbolMatch {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
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
      <h1 className="text-xl font-semibold text-neutral-50">Buscar</h1>
      {!q && <p className="text-sm text-neutral-500">Escribe un ticker o nombre en el buscador.</p>}
      {error && <p className="text-sm text-neutral-500">Dato no disponible: {error}</p>}
      {results && results.length === 0 && q && (
        <p className="text-sm text-neutral-500">Sin resultados para &quot;{q}&quot;.</p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800 bg-neutral-900">
          {results.map((r) => (
            <li key={r.symbol}>
              <Link
                href={`/stocks/${r.symbol}`}
                className="flex items-center justify-between p-3 hover:bg-neutral-800/50"
              >
                <span>
                  <span className="font-medium text-neutral-100">{r.symbol}</span>
                  <span className="ml-2 text-sm text-neutral-500">{r.name}</span>
                </span>
                <span className="text-xs text-neutral-500">{r.exchange}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
