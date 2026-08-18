"use client";

import { useEffect, useState } from "react";
import { QuoteStatGrid } from "./QuoteStatGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import type { MarketSymbol } from "@/lib/market-symbols";

export function FavoritesStatGrid() {
  const [symbols, setSymbols] = useState<MarketSymbol[] | null>(null);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) =>
        setSymbols(
          (data.items ?? []).map((i: { symbol: string; name: string }) => ({
            symbol: i.symbol,
            label: i.symbol,
          })),
        ),
      )
      .catch(() => setSymbols([]));
  }, []);

  if (symbols === null) return <p className="text-sm text-neutral-500">Cargando...</p>;
  if (symbols.length === 0) {
    return (
      <EmptyState
        message="Agrega acciones a tu watchlist para verlas aquí como favoritos."
        ctaLabel="Ir a mi watchlist"
        ctaHref="/watchlist"
      />
    );
  }

  return <QuoteStatGrid symbols={symbols} />;
}
