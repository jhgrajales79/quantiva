"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

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
        <h1 className="text-xl font-semibold text-neutral-50">Noticias</h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex gap-2"
        >
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Filtrar por ticker (ej. AAPL)"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-emerald-500"
          />
        </form>
      </div>

      {!items ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {symbol
            ? `Dato no disponible: sin noticias recientes para ${symbol}.`
            : "Sin noticias todavía. Busca un ticker para poblar el feed."}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-neutral-100 hover:underline"
              >
                {item.title}
              </a>
              {item.summary && (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{item.summary}</p>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                {item.source} · {formatDateTime(item.publishedAt)} · {item.relatedSymbols.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
