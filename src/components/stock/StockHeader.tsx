"use client";

import { useEffect, useState } from "react";
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

interface QuoteData {
  companyName: string | null;
  price: number;
  changeAbs: number | null;
  changePct: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  exchangeName: string | null;
}

interface OverviewData {
  marketCap: number | null;
  enterpriseValue: number | null;
  beta: number | null;
}

export function StockHeader({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setQuote)
      .catch(() => setQuote(null));

    fetch(`/api/stock-overview/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setOverview)
      .catch(() => setOverview(null));

    fetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) => {
        setIsFavorite((data.items ?? []).some((i: { symbol: string }) => i.symbol === symbol));
        setWatchlistLoaded(true);
      })
      .catch(() => setWatchlistLoaded(true));
  }, [symbol]);

  async function toggleFavorite() {
    if (isFavorite) {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
    } else {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
    }
    setIsFavorite(!isFavorite);
  }

  const changePositive = quote?.changePct !== null && quote?.changePct !== undefined && quote.changePct >= 0;

  const rangePct =
    quote?.fiftyTwoWeekLow !== null &&
    quote?.fiftyTwoWeekLow !== undefined &&
    quote?.fiftyTwoWeekHigh !== null &&
    quote?.fiftyTwoWeekHigh !== undefined &&
    quote.fiftyTwoWeekHigh > quote.fiftyTwoWeekLow
      ? ((quote.price - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100
      : null;

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-app-fg">
            {symbol}
            {quote?.companyName && (
              <span className="ml-2 text-lg font-normal text-app-fg-muted">— {quote.companyName}</span>
            )}
          </h1>
          {watchlistLoaded && (
            <button
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Quitar de watchlist" : "Agregar a watchlist"}
              className={isFavorite ? "text-amber-400" : "text-app-fg-faint hover:text-amber-400"}
            >
              ★
            </button>
          )}
          {quote?.exchangeName && (
            <span className="rounded bg-app-surface-2 px-1.5 py-0.5 text-xs text-app-fg-muted">
              {quote.exchangeName}
            </span>
          )}
          <MarketStatusBadge />
        </div>

        {quote ? (
          <p className="mt-1 text-lg text-app-fg-muted">
            {formatCurrency(quote.price)}{" "}
            <span className={changePositive ? "text-emerald-400" : "text-red-400"}>
              {formatCurrency(quote.changeAbs)} ({formatPercent(quote.changePct === null ? null : quote.changePct / 100)})
            </span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-app-fg-muted">Cargando...</p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-6 text-sm">
        <Stat label="Cap. mercado" value={formatCompact(overview?.marketCap ?? null)} />
        <Stat label="EV" value={formatCompact(overview?.enterpriseValue ?? null)} />
        <Stat label="Beta" value={overview?.beta !== null && overview?.beta !== undefined ? overview.beta.toFixed(2) : "—"} />
        <div className="w-40">
          <p className="text-xs text-app-fg-muted">Rango de 52 semanas</p>
          {rangePct !== null ? (
            <>
              <div className="relative mt-1 h-1.5 rounded-full bg-app-surface-2">
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-app-border bg-neutral-100"
                  style={{ left: `${Math.min(100, Math.max(0, rangePct))}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-app-fg-muted">
                <span>{formatCurrency(quote?.fiftyTwoWeekLow ?? null)}</span>
                <span>{rangePct.toFixed(0)}% del rango</span>
                <span>{formatCurrency(quote?.fiftyTwoWeekHigh ?? null)}</span>
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-app-fg-muted">Dato no disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className="font-medium text-app-fg">{value}</p>
    </div>
  );
}
