"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
      <h3 className="mb-3 text-sm font-semibold text-app-fg">Noticias y reportes</h3>
      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news">Noticias</TabsTrigger>
          <TabsTrigger value="filings">Reportes SEC</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          {news === null ? (
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
                  <span className="ml-2 text-xs tabular-nums text-app-fg-muted">
                    {n.source} · {formatDateTime(n.publishedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="filings">
          {filings === null ? (
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
                  <span className="ml-2 text-xs tabular-nums text-app-fg-muted">{f.date}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
      <p className="mt-3 text-xs text-app-fg-faint">Fuente: SEC EDGAR (vía Yahoo Finance).</p>
    </Card>
  );
}
