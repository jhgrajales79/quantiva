"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCompact, formatCurrency } from "@/lib/format";

interface EarningsEvent {
  symbol: string;
  reportDate: string;
  daysUntil: number;
  epsEstimate: number | null;
  revenueEstimate: number | null;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EarningsEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/earnings-calendar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEvents(data?.events ?? []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-app-fg">Calendario</h1>
        <p className="text-sm text-app-fg-muted">
          Próximos reportes de resultados de tu watchlist y tus portafolios. El calendario
          económico multi-país (Fed, CPI, PIB, empleo por región) no está disponible todavía —
          no existe una fuente gratuita verificada; solo se muestran earnings reales de tus
          activos seguidos.
        </p>
      </div>

      <Card padded={false}>
        <div className="p-4">
          <CardHeader title="Próximos earnings" />
        </div>
        {events === null ? (
          <p className="p-4 text-sm text-app-fg-muted">Cargando...</p>
        ) : events.length === 0 ? (
          <div className="p-4">
            <EmptyState
              message="No hay earnings próximos para tus activos seguidos. Agrega tickers a tu watchlist o portafolio para verlos aquí."
              ctaLabel="Ir a mi watchlist"
              ctaHref="/watchlist"
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
                <th className="px-4 py-2">Ticker</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Días</th>
                <th className="px-4 py-2">EPS estimado</th>
                <th className="px-4 py-2">Revenue estimado</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.symbol} className="border-b border-app-border last:border-0 hover:bg-app-surface-2">
                  <td className="px-4 py-2">
                    <Link href={`/stocks/${e.symbol}`} className="font-medium text-app-fg hover:underline">
                      {e.symbol}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-app-fg-muted">{e.reportDate}</td>
                  <td className="px-4 py-2 text-app-fg-muted">
                    {e.daysUntil <= 0 ? "Hoy" : `en ${e.daysUntil} días`}
                  </td>
                  <td className="px-4 py-2 text-app-fg-muted">{formatCurrency(e.epsEstimate)}</td>
                  <td className="px-4 py-2 text-app-fg-muted">{formatCompact(e.revenueEstimate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
