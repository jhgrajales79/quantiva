"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
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

interface HeaderSummary {
  fairValue: { value: number | null; upsidePct: number | null };
  analystTarget: { targetMeanPrice: number | null; numberOfAnalysts: number | null };
  simulator: { fairValue: number | null; upsidePct: number | null };
  finanzas: { revenue: number | null; fiscalDate: string | null };
  earnings: {
    epsActual: number | null;
    epsEstimate: number | null;
    surprisePercent: number | null;
    quarterEndDate: string | null;
  };
  previsiones: { label: string | null; epsEstimateAvg: number | null; epsGrowth: number | null };
  dividendos: { dpsTtm: number | null; dividendYield: number | null };
  accionistas: { institutionsPct: number | null; insidersPct: number | null };
  reportesSec: { type: string | null; date: string | null };
}

interface SummaryTabDef {
  key: string;
  label: string;
  target: string; // id del widget al que hace scroll
}

const SUMMARY_TABS: SummaryTabDef[] = [
  { key: "fair_value", label: "Valor justo", target: "widget-scores" },
  { key: "analyst_target", label: "Objetivo analistas", target: "widget-analyst_consensus" },
  { key: "simulator", label: "Simulador", target: "widget-dcf_simulator" },
  { key: "finanzas", label: "Finanzas", target: "widget-fundamentals" },
  { key: "earnings", label: "Earnings", target: "widget-earnings_history" },
  { key: "previsiones", label: "Previsiones", target: "widget-forecasts" },
  { key: "dividendos", label: "Dividendos", target: "widget-dividends" },
  { key: "accionistas", label: "Accionistas", target: "widget-shareholders" },
  { key: "reportes_sec", label: "Reportes SEC", target: "widget-news_filings" },
];

export function StockHeader({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [extended, setExtended] = useState<ExtendedQuoteData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const [summary, setSummary] = useState<HeaderSummary | null>(null);

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

    setSummary(null);
    fetch(`/api/header-summary/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary)
      .catch(() => setSummary(null));

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

  function scrollToWidget(target: string) {
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <Card>
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
            className={isFavorite ? "text-warning" : "text-app-fg-faint hover:text-warning"}
          >
            <Star size={22} strokeWidth={2} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-start gap-8">
        <div>
          {quote ? (
            <>
              <p className="text-3xl font-semibold tabular-nums text-app-fg">{formatCurrency(quote.price)}</p>
              <p className={`tabular-nums ${changePositive ? "text-positive" : "text-negative"}`}>
                {formatCurrency(quote.changeAbs)} ({formatPercent(quote.changePct === null ? null : quote.changePct / 100)})
              </p>
              {extendedHoursLabel && (
                <p className="mt-0.5 text-xs tabular-nums text-info">
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
            <div className="space-y-1.5">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
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
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-app-border bg-app-fg"
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

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-app-border pt-3 sm:grid-cols-3 lg:grid-cols-9">
        {SUMMARY_TABS.map((tab) => (
          <SummaryCard key={tab.key} tab={tab} summary={summary} onClick={() => scrollToWidget(tab.target)} />
        ))}
      </div>
    </Card>
  );
}

function SummaryCard({
  tab,
  summary,
  onClick,
}: {
  tab: SummaryTabDef;
  summary: HeaderSummary | null;
  onClick: () => void;
}) {
  const content = summary ? renderSummaryContent(tab.key, summary) : null;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-md border border-app-border bg-app-surface-2/40 px-2.5 py-2 text-left transition hover:bg-app-surface-2"
    >
      <span className="text-xs text-app-fg-muted">{tab.label}</span>
      {!summary ? (
        <Skeleton className="mt-1 h-4 w-14" />
      ) : content ? (
        <>
          <span className="mt-0.5 text-sm font-semibold tabular-nums text-app-fg">{content.value}</span>
          {content.sublabel && (
            <span className={`text-xs tabular-nums ${content.sublabelClass ?? "text-app-fg-faint"}`}>
              {content.sublabel}
            </span>
          )}
        </>
      ) : (
        <span className="mt-0.5 text-xs text-app-fg-faint">Dato no disponible</span>
      )}
    </button>
  );
}

function renderSummaryContent(
  key: string,
  summary: HeaderSummary,
): { value: string; sublabel?: string; sublabelClass?: string } | null {
  switch (key) {
    case "fair_value": {
      const { value, upsidePct } = summary.fairValue;
      if (value === null) return null;
      return {
        value: formatCurrency(value),
        sublabel: upsidePct !== null ? `${upsidePct >= 0 ? "+" : ""}${formatPercent(upsidePct)} upside` : undefined,
        sublabelClass: upsidePct !== null ? (upsidePct >= 0 ? "text-positive" : "text-negative") : undefined,
      };
    }
    case "analyst_target": {
      const { targetMeanPrice, numberOfAnalysts } = summary.analystTarget;
      if (targetMeanPrice === null) return null;
      return {
        value: formatCurrency(targetMeanPrice),
        sublabel: numberOfAnalysts !== null ? `${numberOfAnalysts} analistas` : undefined,
      };
    }
    case "simulator": {
      const { fairValue, upsidePct } = summary.simulator;
      if (fairValue === null) return null;
      return {
        value: formatCurrency(fairValue),
        sublabel: upsidePct !== null ? `${upsidePct >= 0 ? "+" : ""}${formatPercent(upsidePct)} upside` : undefined,
        sublabelClass: upsidePct !== null ? (upsidePct >= 0 ? "text-positive" : "text-negative") : undefined,
      };
    }
    case "finanzas": {
      const { revenue, fiscalDate } = summary.finanzas;
      if (revenue === null) return null;
      return {
        value: formatCompact(revenue),
        sublabel: fiscalDate ? `Ingresos · ${fiscalDate}` : "Ingresos anuales",
      };
    }
    case "earnings": {
      const { epsActual, surprisePercent, quarterEndDate } = summary.earnings;
      if (epsActual === null) return null;
      return {
        value: formatCurrency(epsActual),
        sublabel:
          surprisePercent !== null
            ? `${surprisePercent >= 0 ? "+" : ""}${formatPercent(surprisePercent)} vs. estimado`
            : quarterEndDate ?? undefined,
        sublabelClass: surprisePercent !== null ? (surprisePercent >= 0 ? "text-positive" : "text-negative") : undefined,
      };
    }
    case "previsiones": {
      const { epsEstimateAvg, epsGrowth, label } = summary.previsiones;
      if (epsEstimateAvg === null) return null;
      return {
        value: formatCurrency(epsEstimateAvg),
        sublabel:
          epsGrowth !== null
            ? `${epsGrowth >= 0 ? "+" : ""}${formatPercent(epsGrowth)} · ${label ?? "BPA est."}`
            : label ?? undefined,
        sublabelClass: epsGrowth !== null ? (epsGrowth >= 0 ? "text-positive" : "text-negative") : undefined,
      };
    }
    case "dividendos": {
      const { dpsTtm, dividendYield } = summary.dividendos;
      if (dpsTtm === null && dividendYield === null) return null;
      return {
        value: dividendYield !== null ? formatPercent(dividendYield) : formatCurrency(dpsTtm),
        sublabel: dpsTtm !== null ? `${formatCurrency(dpsTtm)} DPS TTM` : "yield",
      };
    }
    case "accionistas": {
      const { institutionsPct } = summary.accionistas;
      if (institutionsPct === null) return null;
      return {
        value: formatPercent(institutionsPct),
        sublabel: "institucional",
      };
    }
    case "reportes_sec": {
      const { type, date } = summary.reportesSec;
      if (type === null) return null;
      return {
        value: type,
        sublabel: date ?? undefined,
      };
    }
    default:
      return null;
  }
}

function Stat({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div>
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className="font-medium tabular-nums text-app-fg">{value}</p>
      {sublabel && <p className="text-xs tabular-nums text-app-fg-faint">{sublabel}</p>}
    </div>
  );
}
