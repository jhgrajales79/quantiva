"use client";

import { useEffect, useState } from "react";
import { Star, Lock } from "lucide-react";
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { CompanyLogo } from "@/components/stock/CompanyLogo";

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

interface ExtendedQuoteData {
  marketState: string | null;
  preMarketPrice: number | null;
  preMarketChange: number | null;
  preMarketChangePercent: number | null;
  postMarketPrice: number | null;
  postMarketChange: number | null;
  postMarketChangePercent: number | null;
}

interface FundamentalsData {
  fundamentals: { cash: number | null; totalDebt: number | null };
}

interface TabDef {
  key: string;
  label: string;
  pro: boolean;
  target: string; // "top" o id del widget al que hace scroll
}

const TABS: TabDef[] = [
  { key: "resumen", label: "Resumen", pro: false, target: "top" },
  { key: "fair_value", label: "Valor justo", pro: true, target: "widget-scores" },
  { key: "analyst_target", label: "Objetivo analistas", pro: true, target: "widget-analyst_consensus" },
  { key: "simulator", label: "Simulador", pro: true, target: "widget-dcf_simulator" },
  { key: "finanzas", label: "Finanzas", pro: false, target: "widget-fundamentals" },
  { key: "earnings", label: "Earnings", pro: true, target: "widget-earnings_history" },
  { key: "previsiones", label: "Previsiones", pro: true, target: "widget-forecasts" },
  { key: "dividendos", label: "Dividendos", pro: true, target: "widget-dividends" },
  { key: "accionistas", label: "Accionistas", pro: true, target: "widget-shareholders" },
  { key: "reportes_sec", label: "Reportes SEC", pro: true, target: "widget-news_filings" },
];

export function StockHeader({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [extended, setExtended] = useState<ExtendedQuoteData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("resumen");

  useEffect(() => {
    fetch(`/api/quotes/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setQuote)
      .catch(() => setQuote(null));

    fetch(`/api/stock-overview/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setOverview)
      .catch(() => setOverview(null));

    fetch(`/api/quotes/${symbol}/extended`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setExtended)
      .catch(() => setExtended(null));

    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setFundamentals)
      .catch(() => setFundamentals(null));

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

  function handleTabClick(tab: TabDef) {
    setActiveTab(tab.key);
    if (tab.target === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(tab.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const netCash =
    fundamentals?.fundamentals.cash !== null &&
    fundamentals?.fundamentals.cash !== undefined &&
    fundamentals?.fundamentals.totalDebt !== null &&
    fundamentals?.fundamentals.totalDebt !== undefined
      ? fundamentals.fundamentals.cash - fundamentals.fundamentals.totalDebt
      : null;

  const extendedHoursLabel =
    extended?.marketState === "PRE" && extended.preMarketPrice !== null
      ? { label: "Antes de la apertura", price: extended.preMarketPrice, change: extended.preMarketChange, pct: extended.preMarketChangePercent }
      : extended?.marketState === "POST" && extended.postMarketPrice !== null
        ? { label: "Tras el cierre", price: extended.postMarketPrice, change: extended.postMarketChange, pct: extended.postMarketChangePercent }
        : null;

  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CompanyLogo symbol={symbol} />
          <h1 className="text-2xl font-semibold text-app-fg">
            {symbol}
            {quote?.companyName && (
              <span className="ml-2 text-lg font-normal text-app-fg-muted">— {quote.companyName}</span>
            )}
          </h1>
          {quote?.exchangeName && (
            <span className="rounded bg-app-surface-2 px-1.5 py-0.5 text-xs text-app-fg-muted">
              {quote.exchangeName}
            </span>
          )}
          <MarketStatusBadge />
        </div>

        {watchlistLoaded && (
          <button
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Quitar de watchlist" : "Agregar a watchlist"}
            className={isFavorite ? "text-amber-400" : "text-app-fg-faint hover:text-amber-400"}
          >
            <Star size={22} strokeWidth={2} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-8">
        <div>
          {quote ? (
            <>
              <p className="text-3xl font-semibold text-app-fg">{formatCurrency(quote.price)}</p>
              <p className={changePositive ? "text-emerald-400" : "text-red-400"}>
                {formatCurrency(quote.changeAbs)} ({formatPercent(quote.changePct === null ? null : quote.changePct / 100)})
              </p>
              {extendedHoursLabel && (
                <p className="mt-0.5 text-xs text-sky-400">
                  {extendedHoursLabel.label} {formatCurrency(extendedHoursLabel.price)}{" "}
                  {extendedHoursLabel.change !== null && extendedHoursLabel.change >= 0 ? "+" : ""}
                  {extendedHoursLabel.change !== null ? formatCurrency(extendedHoursLabel.change) : ""}{" "}
                  {extendedHoursLabel.pct !== null
                    ? `(${extendedHoursLabel.pct >= 0 ? "+" : ""}${formatPercent(extendedHoursLabel.pct / 100)})`
                    : ""}
                </p>
              )}
            </>
          ) : (
            <Spinner className="mt-1" />
          )}
        </div>

        <Stat label="Cap. mercado" value={formatCompact(overview?.marketCap ?? null)} />
        <Stat
          label="EV"
          value={formatCompact(overview?.enterpriseValue ?? null)}
          sublabel={netCash !== null ? `${formatCompact(Math.abs(netCash))} de ${netCash >= 0 ? "caja neta" : "deuda neta"}` : undefined}
        />
        <Stat
          label="Beta"
          value={overview?.beta !== null && overview?.beta !== undefined ? overview.beta.toFixed(2) : "—"}
          sublabel="frente al S&P 500"
        />
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

      <div className="mt-4 flex gap-1 overflow-x-auto border-t border-app-border pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab)}
            className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-app-surface-2 text-app-fg"
                : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
            }`}
          >
            {tab.label}
            {tab.pro && <Lock size={11} strokeWidth={2.5} className="text-app-fg-faint" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div>
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className="font-medium text-app-fg">{value}</p>
      {sublabel && <p className="text-xs text-app-fg-faint">{sublabel}</p>}
    </div>
  );
}
