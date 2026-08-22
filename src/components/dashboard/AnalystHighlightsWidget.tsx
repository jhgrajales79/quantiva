"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { CompanyLogo } from "@/components/stock/CompanyLogo";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowUp, ArrowDown, Minus, ExternalLink } from "lucide-react";

interface AnalystHighlight {
  symbol: string;
  name: string | null;
  date: string;
  firm: string;
  action: string;
  fromGrade: string | null;
  toGrade: string;
  priceTarget: number | null;
}

// Valores típicos que Yahoo reporta en `action`: "up"/"down" para cambios de
// calificación, "main"/"init"/"reit" para reiteraciones o coberturas nuevas
// sin cambio de sentido — no todo cambio de calificación es alcista/bajista.
function actionIcon(action: string) {
  if (action === "up") return <ArrowUp size={14} strokeWidth={2.5} className="text-positive" />;
  if (action === "down") return <ArrowDown size={14} strokeWidth={2.5} className="text-negative" />;
  return <Minus size={14} strokeWidth={2.5} className="text-app-fg-muted" />;
}

export function AnalystHighlightsWidget() {
  const [highlights, setHighlights] = useState<AnalystHighlight[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/analyst-highlights")
      .then((res) => (res.ok ? res.json() : { highlights: [] }))
      .then((data) => setHighlights(data.highlights))
      .catch(() => setHighlights([]));
  }, []);

  return (
    <Card>
      <CardHeader
        title="Análisis de analistas"
        action={<span className="text-xs text-app-fg-muted">últimos cambios de calificación · Yahoo Finance</span>}
      />
      {!highlights ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-card border border-app-border p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="mt-3 h-3 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : highlights.length === 0 ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.symbol}
              className="rounded-card border border-app-border p-3 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/stocks/${h.symbol}`} className="flex items-center gap-2 hover:underline">
                  <CompanyLogo symbol={h.symbol} size={24} />
                  <span className="font-semibold text-app-fg">{h.symbol}</span>
                </Link>
                <div className="flex items-center gap-2">
                  {actionIcon(h.action)}
                  <a
                    href={`https://finance.yahoo.com/quote/${h.symbol}/analysis`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver análisis completo en Yahoo Finance"
                    className="text-app-fg-faint hover:text-brand"
                  >
                    <ExternalLink size={14} strokeWidth={2} />
                  </a>
                </div>
              </div>
              <p className="mt-1 text-xs text-app-fg-muted">{h.firm}</p>
              <p className="mt-2 text-sm text-app-fg">
                {h.fromGrade && h.fromGrade !== h.toGrade ? (
                  <>
                    <span className="text-app-fg-muted">{h.fromGrade}</span> → {h.toGrade}
                  </>
                ) : (
                  h.toGrade
                )}
              </p>
              {h.priceTarget !== null && (
                <p className="mt-1 text-xs text-app-fg-muted">Precio objetivo: {formatCurrency(h.priceTarget)}</p>
              )}
              <p className="mt-2 text-xs text-app-fg-faint">{formatDateTime(h.date)}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
