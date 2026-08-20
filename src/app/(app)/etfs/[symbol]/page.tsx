"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

interface QuoteData {
  price: number;
  changePct: number | null;
  companyName: string | null;
}

interface EtfProfile {
  holdings: { symbol: string; name: string; weightPct: number }[];
  sectorWeightings: { sector: string; weightPct: number }[];
  stockPositionPct: number | null;
  bondPositionPct: number | null;
  cashPositionPct: number | null;
  family: string | null;
  category: string | null;
  expenseRatio: number | null;
  totalNetAssets: number | null;
}

export default function EtfDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [profile, setProfile] = useState<EtfProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/quotes/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setQuote)
      .catch(() => setQuote(null));
    fetch(`/api/etf/${symbol}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Dato no disponible");
        }
        return res.json();
      })
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [symbol]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-app-fg">
          {symbol}
          {quote?.companyName && (
            <span className="ml-2 text-lg font-normal text-app-fg-muted">— {quote.companyName}</span>
          )}
        </h1>
        <MarketStatusBadge />
      </div>

      {quote ? (
        <p className="text-lg tabular-nums text-app-fg-muted">
          {formatCurrency(quote.price)}{" "}
          <span className={quote.changePct !== null && quote.changePct >= 0 ? "text-positive" : "text-negative"}>
            {formatPercent(quote.changePct === null ? null : quote.changePct / 100)}
          </span>
        </p>
      ) : (
        <Spinner label="Cargando cotización..." />
      )}

      {error ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>
      ) : !profile ? (
        <Spinner label="Cargando ficha del ETF..." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Categoría" value={profile.category ?? "Dato no disponible"} />
            <StatCard label="Familia" value={profile.family ?? "Dato no disponible"} />
            <StatCard label="Expense Ratio" value={formatPercent(profile.expenseRatio)} />
            <StatCard
              label="AUM"
              value={
                profile.totalNetAssets !== null ? formatCompact(profile.totalNetAssets * 1_000_000) : "Dato no disponible"
              }
            />
          </div>

          <Card>
            <CardHeader title="Composición" />
            <div className="flex gap-4 text-sm tabular-nums">
              <span>Acciones: {formatPercent(profile.stockPositionPct !== null ? profile.stockPositionPct / 100 : null)}</span>
              <span>Bonos: {formatPercent(profile.bondPositionPct !== null ? profile.bondPositionPct / 100 : null)}</span>
              <span>Efectivo: {formatPercent(profile.cashPositionPct !== null ? profile.cashPositionPct / 100 : null)}</span>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top 10 holdings" />
              {profile.holdings.length === 0 ? (
                <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {profile.holdings.map((h) => (
                    <li key={h.symbol} className="flex justify-between">
                      <span className="text-app-fg">
                        {h.symbol} <span className="text-app-fg-muted">{h.name}</span>
                      </span>
                      <span className="tabular-nums text-app-fg-muted">{h.weightPct.toFixed(2)}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Exposición sectorial" />
              {profile.sectorWeightings.length === 0 ? (
                <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {[...profile.sectorWeightings]
                    .sort((a, b) => b.weightPct - a.weightPct)
                    .map((s) => (
                      <li key={s.sector}>
                        <div className="flex justify-between text-xs text-app-fg-muted">
                          <span className="capitalize">{s.sector.replace(/_/g, " ")}</span>
                          <span className="tabular-nums">{s.weightPct.toFixed(1)}%</span>
                        </div>
                        <div className="mt-0.5 h-1.5 rounded-pill bg-app-surface-2">
                          <div
                            className="h-1.5 rounded-pill bg-brand"
                            style={{ width: `${Math.min(100, s.weightPct)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
