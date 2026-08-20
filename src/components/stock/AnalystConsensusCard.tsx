"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

interface AnalystData {
  distribution: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
  recentChanges: {
    date: string;
    firm: string;
    toGrade: string;
    fromGrade: string | null;
    action: string;
    priceTarget: number | null;
  }[];
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  numberOfAnalysts: number | null;
}

const SEGMENT_COLORS: Record<string, string> = {
  strongBuy: "bg-positive",
  buy: "bg-positive/70",
  hold: "bg-warning",
  sell: "bg-negative/70",
  strongSell: "bg-negative",
};

export function AnalystConsensusCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<AnalystData | null>(null);

  useEffect(() => {
    fetch(`/api/analysts/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  const total = data?.distribution
    ? Object.values(data.distribution).reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <Card>
      <CardHeader title={`Consenso de analistas${data?.numberOfAnalysts ? ` · ${data.numberOfAnalysts}` : ""}`} />
      {!data ? (
        <Spinner />
      ) : (
        <>
          {data.distribution && total > 0 ? (
            <div className="mb-3 flex h-2.5 overflow-hidden rounded-full">
              {Object.entries(data.distribution).map(([key, value]) => (
                <div
                  key={key}
                  className={SEGMENT_COLORS[key]}
                  style={{ width: `${(value / total) * 100}%` }}
                />
              ))}
            </div>
          ) : (
            <p className="mb-3 text-sm text-app-fg-muted">Dato no disponible.</p>
          )}

          <p className="mb-4 text-sm text-app-fg-muted">
            Precio objetivo promedio: {formatCurrency(data.targetMeanPrice)} (rango{" "}
            {formatCurrency(data.targetLowPrice)} – {formatCurrency(data.targetHighPrice)})
          </p>

          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-fg-muted">
            Cambios recientes
          </h4>
          {data.recentChanges.length === 0 ? (
            <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentChanges.slice(0, 5).map((c, i) => (
                <li key={i} className="text-sm">
                  <span className="text-app-fg">{c.firm}</span>{" "}
                  <span className="text-app-fg-muted">
                    {c.fromGrade && c.fromGrade !== c.toGrade ? `${c.fromGrade} → ` : ""}
                    {c.toGrade}
                  </span>
                  {c.priceTarget !== null && (
                    <span className="text-app-fg-muted"> · PT {formatCurrency(c.priceTarget)}</span>
                  )}
                  <span className="ml-2 text-xs text-app-fg-faint">{formatDateTime(c.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
