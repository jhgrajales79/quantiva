"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCompact, formatCurrency } from "@/lib/format";
import { EconomicCalendar } from "@/components/calendar/EconomicCalendar";
import { Building2, CalendarDays } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface EarningsEvent {
  symbol: string;
  reportDate: string;
  daysUntil: number;
  epsEstimate: number | null;
  revenueEstimate: number | null;
}

function EarningsCalendar() {
  const [events, setEvents] = useState<EarningsEvent[] | null>(null);

  useEffect(() => {
    fetch("/api/earnings-calendar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEvents(data?.events ?? []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <Card padded={false}>
      <div className="p-4">
        <CardHeader title="Próximos earnings" subtitle="de tu watchlist y tus portafolios" />
      </div>
      {events === null ? (
        <Spinner className="p-4" />
      ) : events.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Building2}
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
  );
}

export default function CalendarPage() {
  const [tab, setTab] = useState<"economic" | "earnings">("economic");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
          <CalendarDays size={20} strokeWidth={2} />
          Calendario
        </h1>
        <p className="text-sm text-app-fg-muted">
          Calendario económico real (EE.UU. e internacional) vía Yahoo Finance, más los próximos
          earnings de tu watchlist y portafolios. La fuente del calendario económico no expone
          consenso de mercado ("Estimado"), solo valor previo y valor real una vez publicado.
        </p>
      </div>

      <div className="flex gap-1.5 border-b border-app-border pb-px">
        {(
          [
            ["economic", "Calendario económico"],
            ["earnings", "Earnings"],
          ] as [typeof tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              tab === value
                ? "border-b-2 border-orange-500 text-app-fg"
                : "text-app-fg-muted hover:text-app-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "economic" ? <EconomicCalendar /> : <EarningsCalendar />}
    </div>
  );
}
