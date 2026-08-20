"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCurrency, formatPercent } from "@/lib/format";

interface HistoryQuarter {
  quarterEndDate: string | null;
  epsActual: number | null;
  epsEstimate: number | null;
  epsDifference: number | null;
  surprisePercent: number | null;
}

export function EarningsHistoryCard({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<HistoryQuarter[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/earnings-history/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHistory(data?.history ?? null))
      .catch(() => setHistory(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Earnings" subtitle="BPA real vs. estimado, últimos trimestres reportados" />
      {!loaded ? (
        <Spinner />
      ) : !history || history.length === 0 ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
              <th className="py-1.5">Trimestre</th>
              <th className="py-1.5 text-right">Real</th>
              <th className="py-1.5 text-right">Estimado</th>
              <th className="py-1.5 text-right">Sorpresa</th>
            </tr>
          </thead>
          <tbody>
            {history.map((q) => (
              <tr key={q.quarterEndDate} className="border-b border-app-border last:border-0">
                <td className="py-1.5 text-app-fg-muted">{q.quarterEndDate ?? "—"}</td>
                <td className="py-1.5 text-right text-app-fg">{formatCurrency(q.epsActual)}</td>
                <td className="py-1.5 text-right text-app-fg-muted">{formatCurrency(q.epsEstimate)}</td>
                <td
                  className={`py-1.5 text-right font-medium tabular-nums ${
                    q.surprisePercent === null
                      ? "text-app-fg-faint"
                      : q.surprisePercent >= 0
                        ? "text-positive"
                        : "text-negative"
                  }`}
                >
                  {q.surprisePercent !== null
                    ? `${q.surprisePercent >= 0 ? "+" : ""}${formatPercent(q.surprisePercent)}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
