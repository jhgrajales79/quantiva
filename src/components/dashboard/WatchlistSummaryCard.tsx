"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface WatchlistItem {
  symbol: string;
  name: string;
}

export function WatchlistSummaryCard() {
  const [items, setItems] = useState<WatchlistItem[] | null>(null);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const count = items?.length ?? 0;

  return (
    <Card>
      <CardHeader title={`Watchlist${items !== null ? ` · ${count} acciones` : ""}`} />
      {items === null ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : count === 0 ? (
        <EmptyState
          message="Aún no sigues ninguna acción. Busca una empresa y agrégala a tu watchlist para verla aquí con su precio, su valor justo y su potencial."
          ctaLabel="Ver todo mi watchlist"
          ctaHref="/watchlist"
        />
      ) : (
        <div className="space-y-2">
          <ul className="space-y-1">
            {items.slice(0, 4).map((item) => (
              <li key={item.symbol} className="flex justify-between text-sm">
                <Link href={`/stocks/${item.symbol}`} className="font-medium text-app-fg hover:underline">
                  {item.symbol}
                </Link>
                <span className="text-app-fg-muted">{item.name}</span>
              </li>
            ))}
          </ul>
          <Link href="/watchlist" className="inline-flex text-sm text-emerald-400 hover:underline">
            Ver todo mi watchlist →
          </Link>
        </div>
      )}
    </Card>
  );
}
