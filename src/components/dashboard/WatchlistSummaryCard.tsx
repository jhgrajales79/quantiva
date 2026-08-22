"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Eye } from "lucide-react";

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
    <Card className="flex h-full flex-col">
      <CardHeader title={`Watchlist${items !== null ? ` · ${count} acciones` : ""}`} />
      {items === null ? (
        <SkeletonText lines={4} className="py-1" />
      ) : count === 0 ? (
        <EmptyState
          icon={Eye}
          message="Aún no sigues ninguna acción. Busca una empresa y agrégala a tu watchlist para verla aquí con su precio, su valor justo y su potencial."
          ctaLabel="Ver todo mi watchlist"
          ctaHref="/watchlist"
        />
      ) : (
        <div className="flex flex-1 flex-col">
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
          <Link href="/watchlist" className="mt-auto inline-flex pt-2 text-sm text-brand hover:underline">
            Ver todo mi watchlist →
          </Link>
        </div>
      )}
    </Card>
  );
}
