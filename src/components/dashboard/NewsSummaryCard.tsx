"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/format";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export function NewsSummaryCard() {
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    fetch("/api/news/watchlist")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <Card>
      <CardHeader title="Noticias de tus acciones" />
      {items === null ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : items.length === 0 ? (
        <EmptyState message="Todavía no hay noticias de las acciones que sigues." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="text-sm">
              <a href={item.url} target="_blank" rel="noreferrer" className="text-app-fg hover:underline">
                {item.title}
              </a>
              <span className="ml-2 text-xs text-app-fg-muted">
                {item.source} · {formatDateTime(item.publishedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
