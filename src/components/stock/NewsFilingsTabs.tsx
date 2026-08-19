"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface SecFiling {
  date: string;
  type: string;
  title: string;
  edgarUrl: string;
}

export function NewsFilingsTabs({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<"news" | "filings">("news");
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [filings, setFilings] = useState<SecFiling[] | null>(null);

  useEffect(() => {
    fetch(`/api/news?symbol=${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setNews(data?.items.slice(0, 8) ?? []))
      .catch(() => setNews([]));
    fetch(`/api/sec-filings/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFilings(data?.filings ?? []))
      .catch(() => setFilings([]));
  }, [symbol]);

  return (
    <Card>
      <CardHeader
        title="Noticias y reportes"
        action={
          <div className="flex gap-1">
            <button
              onClick={() => setTab("news")}
              className={`rounded-md px-2 py-1 text-xs font-medium ${tab === "news" ? "bg-app-surface-2 text-app-fg" : "text-app-fg-muted"}`}
            >
              Noticias
            </button>
            <button
              onClick={() => setTab("filings")}
              className={`rounded-md px-2 py-1 text-xs font-medium ${tab === "filings" ? "bg-app-surface-2 text-app-fg" : "text-app-fg-muted"}`}
            >
              Reportes SEC
            </button>
          </div>
        }
      />

      {tab === "news" &&
        (news === null ? (
          <Spinner />
        ) : news.length === 0 ? (
          <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
        ) : (
          <ul className="space-y-2">
            {news.map((n) => (
              <li key={n.id} className="text-sm">
                <a href={n.url} target="_blank" rel="noreferrer" className="text-app-fg hover:underline">
                  {n.title}
                </a>
                <span className="ml-2 text-xs text-app-fg-muted">
                  {n.source} · {formatDateTime(n.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        ))}

      {tab === "filings" &&
        (filings === null ? (
          <Spinner />
        ) : filings.length === 0 ? (
          <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
        ) : (
          <ul className="space-y-2">
            {filings.map((f, i) => (
              <li key={i} className="text-sm">
                <a href={f.edgarUrl} target="_blank" rel="noreferrer" className="text-app-fg hover:underline">
                  {f.type} — {f.title}
                </a>
                <span className="ml-2 text-xs text-app-fg-muted">{f.date}</span>
              </li>
            ))}
          </ul>
        ))}
      <p className="mt-3 text-xs text-app-fg-faint">Fuente: SEC EDGAR (vía Yahoo Finance).</p>
    </Card>
  );
}
