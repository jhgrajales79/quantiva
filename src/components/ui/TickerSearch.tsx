"use client";

import { useEffect, useState } from "react";

export interface TickerMatch {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
}

// Autocompletado en tiempo real contra /api/search (Yahoo Finance en vivo,
// sin caché) — usado por cualquier input del sitio donde el usuario escriba
// un ticker o nombre de empresa, para garantizar que siempre elige un
// símbolo real y vigente, no uno tipeado a mano.
export function useTickerSearch(query: string) {
  const [results, setResults] = useState<TickerMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled) setResults(data?.results ?? []);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading };
}

export function TickerSuggestions({
  results,
  onSelect,
}: {
  results: TickerMatch[];
  onSelect: (match: TickerMatch) => void;
}) {
  if (results.length === 0) return null;

  return (
    <div className="absolute right-0 top-full z-30 mt-1 max-h-72 w-80 max-w-[90vw] overflow-y-auto rounded-md border border-app-border bg-app-surface shadow-lg">
      {results.map((r) => (
        <button
          key={r.symbol}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(r)}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-app-surface-2"
        >
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-medium text-app-fg">{r.symbol}</span>
            <span className="min-w-0 truncate text-app-fg-muted">{r.name}</span>
          </span>
          {r.exchange && (
            <span className="shrink-0 text-xs text-app-fg-faint">{r.exchange}</span>
          )}
        </button>
      ))}
    </div>
  );
}
