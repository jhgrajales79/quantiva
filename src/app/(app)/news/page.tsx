"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { SkeletonText } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Newspaper } from "lucide-react";

interface NewsItem {
  id: string;
  source: string;
  publishedAt: string;
  title: string;
  summary: string | null;
  url: string;
  relatedSymbols: string[];
  category: string;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    const url = symbol ? `/api/news?symbol=${symbol}` : "/api/news";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setItems(data.items));
  }, [symbol]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Newspaper}
        title="Noticias"
        action={
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="Filtrar por ticker (ej. AAPL)"
              className="rounded-md border border-app-border bg-app-surface px-2 py-1 text-xs text-app-fg outline-none focus:border-brand"
            />
          </form>
        }
      />

      {!items ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <SkeletonText lines={2} />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          message={
            symbol
              ? `Sin noticias recientes para ${symbol}.`
              : "Sin noticias todavía. Busca un ticker para poblar el feed."
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Card>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-app-fg hover:underline"
                >
                  {item.title}
                </a>
                {item.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-app-fg-muted">{item.summary}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-app-fg-muted">
                  <Badge variant="info">{item.source}</Badge>
                  <span className="tabular-nums">{formatDateTime(item.publishedAt)}</span>
                  {item.relatedSymbols.length > 0 && (
                    <span>{item.relatedSymbols.join(", ")}</span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
