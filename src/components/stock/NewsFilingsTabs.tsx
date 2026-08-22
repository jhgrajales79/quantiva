"use client";

import { useEffect, useState } from "react";
import { Newspaper, FileText } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonText } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/format";

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
      <CardHeader title="Noticias y reportes" />
      <Tabs defaultValue="news">
        <TabsList>
          <TabsTrigger value="news">Noticias</TabsTrigger>
          <TabsTrigger value="filings">Reportes SEC</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          {news === null ? (
            <SkeletonText lines={4} className="py-1" />
          ) : news.length === 0 ? (
            <EmptyState icon={Newspaper} message="Todavía no hay noticias recientes para esta acción." />
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
            <SkeletonText lines={4} className="py-1" />
          ) : filings.length === 0 ? (
            <EmptyState icon={FileText} message="No hay reportes SEC recientes disponibles para esta acción." />
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
