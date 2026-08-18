"use client";

import { useEffect, useState } from "react";
import { PriceChart } from "@/components/charts/PriceChart";
import { FairValueModels } from "@/components/cards/FairValueModels";
import { ScorePill } from "@/components/cards/ScorePill";
import { ValuationBadgePill } from "@/components/cards/ValuationBadgePill";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/format";
import type { ValuationBadge } from "@/lib/valuation/consensus";

interface QuoteData {
  price: number;
  changePct: number | null;
  marketCap: number | null;
  fetchedAt: string;
  source: string;
}

interface FundamentalsData {
  fundamentals: {
    revenue: number | null;
    ebitda: number | null;
    netIncome: number | null;
    eps: number | null;
    fcf: number | null;
    totalDebt: number | null;
    cash: number | null;
    fetchedAt: string;
  };
  ratios: {
    pe: number | null;
    forwardPe: number | null;
    evEbitda: number | null;
    ps: number | null;
    pb: number | null;
    dividendYield: number | null;
  } | null;
}

interface ValuationData {
  fairValueConsensus: number | null;
  upsidePct: number | null;
  marginOfSafetyPrice: number | null;
  badge: ValuationBadge | null;
  scores: {
    value: number | null;
    quality: number | null;
    growth: number | null;
    momentum: number | null;
    investment: number | null;
  };
  possibleValueTrap: boolean;
  models: { model: string; fairValue: number | null; assumptions: Record<string, unknown>; unavailableReason: string | null }[];
  calculatedAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export function StockPageClient({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [prices, setPrices] = useState<{ date: string; close: number }[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const quoteData = await safeFetch<QuoteData>(`/api/quotes/${symbol}`);
      if (!mounted) return;
      setQuote(quoteData);

      const pricesData = await safeFetch<{ prices: { date: string; close: number }[] }>(
        `/api/prices/${symbol}`,
      );
      if (!mounted) return;
      setPrices(pricesData?.prices ?? []);

      const fundData = await safeFetch<FundamentalsData>(`/api/fundamentals/${symbol}`);
      if (!mounted) return;
      setFundamentals(fundData);

      if (quoteData && fundData) {
        const valData = await safeFetch<ValuationData>(`/api/valuation/${symbol}`);
        if (!mounted) return;
        setValuation(valData);
      }

      const newsData = await safeFetch<{ items: NewsItem[] }>(`/api/news?symbol=${symbol}`);
      if (!mounted) return;
      setNews(newsData?.items.slice(0, 5) ?? []);

      if (!quoteData) setError("Dato no disponible: no se pudo obtener la cotización actual.");
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  async function handleAddToWatchlist() {
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    setAdded(true);
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Cargando {symbol}...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-50">{symbol}</h1>
          {quote ? (
            <p className="text-lg text-neutral-300">
              {formatCurrency(quote.price)}{" "}
              <span className={quote.changePct && quote.changePct >= 0 ? "text-emerald-400" : "text-red-400"}>
                {formatPercent(quote.changePct === null ? null : quote.changePct / 100)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-neutral-500">{error}</p>
          )}
        </div>
        <button
          onClick={handleAddToWatchlist}
          disabled={added}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {added ? "En tu watchlist" : "+ Watchlist"}
        </button>
      </div>

      {valuation && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ScorePill label="Value" value={valuation.scores.value} />
          <ScorePill label="Quality" value={valuation.scores.quality} />
          <ScorePill label="Growth" value={valuation.scores.growth} />
          <ScorePill label="Momentum" value={valuation.scores.momentum} />
          <ScorePill label="Investment" value={valuation.scores.investment} />
        </div>
      )}

      {valuation?.possibleValueTrap && (
        <div className="rounded-md border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-300">
          ⚠️ Possible Value Trap: la acción parece barata, pero presenta señales de deterioro
          fundamental (caída de ingresos, FCF negativo o deuda elevada).
        </div>
      )}

      <PriceChart data={prices} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Fair Value Consensus</h3>
          {valuation?.fairValueConsensus ? (
            <>
              <p className="text-2xl font-semibold text-neutral-50">
                {formatCurrency(valuation.fairValueConsensus)}
              </p>
              <p className="text-sm text-neutral-400">
                Upside: {formatPercent(valuation.upsidePct)} · Margen de seguridad:{" "}
                {formatCurrency(valuation.marginOfSafetyPrice)}
              </p>
              <div className="mt-2">
                <ValuationBadgePill badge={valuation.badge} />
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Dato no disponible: no hay suficientes modelos de valoración con datos completos
              para este activo todavía.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Fundamentales (anual)</h3>
          {fundamentals ? (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-neutral-500">Revenue</dt>
              <dd className="text-right">{formatCurrency(fundamentals.fundamentals.revenue)}</dd>
              <dt className="text-neutral-500">EBITDA</dt>
              <dd className="text-right">{formatCurrency(fundamentals.fundamentals.ebitda)}</dd>
              <dt className="text-neutral-500">Net Income</dt>
              <dd className="text-right">{formatCurrency(fundamentals.fundamentals.netIncome)}</dd>
              <dt className="text-neutral-500">EPS</dt>
              <dd className="text-right">{formatCurrency(fundamentals.fundamentals.eps)}</dd>
              <dt className="text-neutral-500">FCF</dt>
              <dd className="text-right">{formatCurrency(fundamentals.fundamentals.fcf)}</dd>
              <dt className="text-neutral-500">P/E</dt>
              <dd className="text-right">{fundamentals.ratios?.pe?.toFixed(2) ?? "—"}</dd>
              <dt className="text-neutral-500">EV/EBITDA</dt>
              <dd className="text-right">{fundamentals.ratios?.evEbitda?.toFixed(2) ?? "—"}</dd>
              <dt className="text-neutral-500">Dividend Yield</dt>
              <dd className="text-right">{formatPercent(fundamentals.ratios?.dividendYield ?? null)}</dd>
            </dl>
          ) : (
            <p className="text-sm text-neutral-500">Dato no disponible.</p>
          )}
          <p className="mt-3 text-xs text-neutral-600">
            Actualizado: {fundamentals ? formatDateTime(fundamentals.fundamentals.fetchedAt) : "—"}
          </p>
        </div>
      </div>

      {valuation && <FairValueModels models={valuation.models} />}

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h3 className="mb-3 text-sm font-semibold text-neutral-200">Noticias recientes</h3>
        {news.length === 0 ? (
          <p className="text-sm text-neutral-500">Dato no disponible.</p>
        ) : (
          <ul className="space-y-2">
            {news.map((n) => (
              <li key={n.id} className="text-sm">
                <a href={n.url} target="_blank" rel="noreferrer" className="text-neutral-200 hover:underline">
                  {n.title}
                </a>
                <span className="ml-2 text-xs text-neutral-500">
                  {n.source} · {formatDateTime(n.publishedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
