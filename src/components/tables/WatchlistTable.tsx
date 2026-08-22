"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import { valuationBadge } from "@/lib/valuation/consensus";
import { ValuationBadgePill } from "@/components/cards/ValuationBadgePill";
import { Spinner } from "@/components/ui/Spinner";
import { useTickerSearch, TickerSuggestions } from "@/components/ui/TickerSearch";
import { Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";

interface WatchlistRow {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  fairValueConsensus: number | null;
  upsidePct: number | null;
  investmentScore: number | null;
  intrinsicValue: number | null;
  relativeValue: number | null;
}

type SortKey =
  | "symbol"
  | "price"
  | "changePct"
  | "upsidePct"
  | "investmentScore"
  | "intrinsicValue"
  | "relativeValue";

export function WatchlistTable() {
  const [rows, setRows] = useState<WatchlistRow[] | null>(null);
  const [newSymbol, setNewSymbol] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [error, setError] = useState<string | null>(null);
  const { results: suggestions } = useTickerSearch(suggestOpen ? newSymbol : "");

  const load = useCallback(async () => {
    const res = await fetch("/api/watchlist");
    if (!res.ok) {
      setError("No se pudo cargar la watchlist.");
      return;
    }
    const data = await res.json();
    const items: { symbol: string; name: string }[] = data.items;

    const rowsData = await Promise.all(
      items.map(async (item) => {
        const [quoteRes, valuationRes] = await Promise.all([
          fetch(`/api/quotes/${item.symbol}`),
          fetch(`/api/valuation-cached/${item.symbol}`),
        ]);
        const quote = quoteRes.ok ? await quoteRes.json() : null;
        const valuation = valuationRes.ok ? await valuationRes.json() : null;

        return {
          symbol: item.symbol,
          name: item.name,
          price: quote?.price ?? null,
          changePct: quote?.changePct ?? null,
          fairValueConsensus: valuation?.consensus?.fairValueConsensus ?? null,
          upsidePct: valuation?.consensus?.upsidePct ?? null,
          investmentScore: valuation?.consensus?.investmentScore ?? null,
          intrinsicValue: valuation?.intrinsicValue ?? null,
          relativeValue: valuation?.relativeValue ?? null,
        } satisfies WatchlistRow;
      }),
    );

    setRows(rowsData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addSymbol(symbol: string) {
    if (!symbol.trim()) return;
    setError(null);
    setSuggestOpen(false);
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: symbol.trim().toUpperCase() }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo agregar el ticker.");
      return;
    }
    setNewSymbol("");
    load();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    addSymbol(newSymbol);
  }

  async function handleRemove(symbol: string) {
    await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
    load();
  }

  const sortedRows = rows
    ? [...rows].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av === null) return 1;
        if (bv === null) return -1;
        if (typeof av === "string" || typeof bv === "string") {
          return String(av).localeCompare(String(bv));
        }
        return (bv as number) - (av as number);
      })
    : [];

  return (
    <div className="rounded-card border border-app-border bg-app-surface shadow-card">
      <div className="flex items-center justify-between border-b border-app-border p-3">
        <h2 className="text-sm font-semibold text-app-fg">Watchlist</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative">
            <input
              value={newSymbol}
              onChange={(e) => {
                setNewSymbol(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setSuggestOpen(false)}
              placeholder="AAPL"
              className="w-28 rounded-md border border-app-border bg-app-bg px-2 py-1 text-xs text-app-fg outline-none focus:border-brand"
            />
            {suggestOpen && (
              <TickerSuggestions results={suggestions} onSelect={(m) => addSymbol(m.symbol)} />
            )}
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            Agregar
          </button>
        </form>
      </div>

      {error && <p className="p-3 text-sm text-negative">{error}</p>}

      {!rows ? (
        <Spinner className="p-4" />
      ) : rows.length === 0 ? (
        <p className="p-4 text-sm text-app-fg-muted">
          Tu watchlist está vacía. Agrega un ticker arriba.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <Thead>
              {[
                { key: "symbol", label: "Ticker" },
                { key: "price", label: "Precio" },
                { key: "changePct", label: "Var. día" },
                { key: "upsidePct", label: "Fair Value / Upside" },
                { key: "intrinsicValue", label: "Valor intrínseco (DCF)" },
                { key: "relativeValue", label: "Valor relativo (múltiplos)" },
                { key: "investmentScore", label: "Investment Score" },
              ].map((col) => (
                <Th
                  key={col.key}
                  sortable
                  active={sortKey === col.key}
                  onClick={() => setSortKey(col.key as SortKey)}
                >
                  {col.label}
                </Th>
              ))}
              <Th />
            </Thead>
            <Tbody>
              {sortedRows.map((row) => (
                <Tr key={row.symbol}>
                  <Td>
                    <Link href={`/stocks/${row.symbol}`} className="font-medium text-app-fg hover:underline">
                      {row.symbol}
                    </Link>
                    <div className="text-xs text-app-fg-muted">{row.name}</div>
                  </Td>
                  <Td>{formatCurrency(row.price)}</Td>
                  <Td
                    className={
                      row.changePct === null
                        ? "text-app-fg-muted"
                        : row.changePct >= 0
                          ? "text-positive"
                          : "text-negative"
                    }
                  >
                    {formatPercent(row.changePct === null ? null : row.changePct / 100)}
                  </Td>
                  <Td>
                    {row.fairValueConsensus === null ? (
                      <span className="text-xs text-app-fg-muted">
                        Sin cálculo — abre la ficha del activo
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span>{formatCurrency(row.fairValueConsensus)}</span>
                        <ValuationBadgePill badge={valuationBadge(row.upsidePct)} />
                      </div>
                    )}
                  </Td>
                  <Td
                    className={
                      row.intrinsicValue === null || row.price === null
                        ? "text-app-fg-muted"
                        : row.intrinsicValue >= row.price
                          ? "text-positive"
                          : "text-negative"
                    }
                  >
                    {row.intrinsicValue === null ? (
                      <span className="text-xs text-app-fg-muted">No disponible</span>
                    ) : (
                      formatCurrency(row.intrinsicValue)
                    )}
                  </Td>
                  <Td
                    className={
                      row.relativeValue === null || row.price === null
                        ? "text-app-fg-muted"
                        : row.relativeValue >= row.price
                          ? "text-positive"
                          : "text-negative"
                    }
                  >
                    {row.relativeValue === null ? (
                      <span className="text-xs text-app-fg-muted">No disponible</span>
                    ) : (
                      formatCurrency(row.relativeValue)
                    )}
                  </Td>
                  <Td>{row.investmentScore === null ? "—" : row.investmentScore.toFixed(0)}</Td>
                  <Td align="right">
                    <button
                      onClick={() => handleRemove(row.symbol)}
                      className="text-xs text-app-fg-muted hover:text-negative"
                    >
                      Quitar
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </table>
        </div>
      )}
    </div>
  );
}
