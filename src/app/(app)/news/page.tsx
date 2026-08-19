"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
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
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
          <Newspaper size={20} strokeWidth={2} />
          Noticias
        </h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex gap-2"
        >
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Filtrar por ticker (ej. AAPL)"
            className="rounded-md border border-app-border bg-app-surface px-2 py-1 text-xs text-app-fg outline-none focus:border-emerald-500"
          />
        </form>
      </div>

      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="text-sm text-app-fg-muted">
          {symbol
            ? `Dato no disponible: sin noticias recientes para ${symbol}.`
            : "Sin noticias todavía. Busca un ticker para poblar el feed."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-app-border bg-app-surface p-4">
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
              <p className="mt-2 text-xs text-app-fg-muted">
                {item.source} · {formatDateTime(item.publishedAt)} · {item.relatedSymbols.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
