"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import { valuationBadge } from "@/lib/valuation/consensus";
import { ValuationBadgePill } from "@/components/cards/ValuationBadgePill";

interface WatchlistRow {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  fairValueConsensus: number | null;
  upsidePct: number | null;
  investmentScore: number | null;
}

type SortKey = "symbol" | "price" | "changePct" | "upsidePct" | "investmentScore";

export function WatchlistTable() {
  const [rows, setRows] = useState<WatchlistRow[] | null>(null);
  const [newSymbol, setNewSymbol] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [error, setError] = useState<string | null>(null);

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
        } satisfies WatchlistRow;
      }),
    );

    setRows(rowsData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol.trim()) return;
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: newSymbol.trim().toUpperCase() }),
    });
    setNewSymbol("");
    load();
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
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 p-3">
        <h2 className="text-sm font-semibold text-neutral-200">Watchlist</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="AAPL"
            className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Agregar
          </button>
        </form>
      </div>

      {error && <p className="p-3 text-sm text-red-400">{error}</p>}

      {!rows ? (
        <p className="p-4 text-sm text-neutral-500">Cargando...</p>
      ) : rows.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">
          Tu watchlist está vacía. Agrega un ticker arriba.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-xs text-neutral-500">
                {[
                  { key: "symbol", label: "Ticker" },
                  { key: "price", label: "Precio" },
                  { key: "changePct", label: "Var. día" },
                  { key: "upsidePct", label: "Fair Value / Upside" },
                  { key: "investmentScore", label: "Investment Score" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-3 py-2 hover:text-neutral-300"
                    onClick={() => setSortKey(col.key as SortKey)}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.symbol} className="border-b border-neutral-900 hover:bg-neutral-800/50">
                  <td className="px-3 py-2">
                    <Link href={`/stocks/${row.symbol}`} className="font-medium text-neutral-100 hover:underline">
                      {row.symbol}
                    </Link>
                    <div className="text-xs text-neutral-500">{row.name}</div>
                  </td>
                  <td className="px-3 py-2">{formatCurrency(row.price)}</td>
                  <td
                    className={`px-3 py-2 ${
                      row.changePct === null
                        ? "text-neutral-500"
                        : row.changePct >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                    }`}
                  >
                    {formatPercent(row.changePct === null ? null : row.changePct / 100)}
                  </td>
                  <td className="px-3 py-2">
                    {row.fairValueConsensus === null ? (
                      <span className="text-xs text-neutral-500">
                        Sin cálculo — abre la ficha del activo
                      </span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span>{formatCurrency(row.fairValueConsensus)}</span>
                        <ValuationBadgePill badge={valuationBadge(row.upsidePct)} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.investmentScore === null ? "—" : row.investmentScore.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleRemove(row.symbol)}
                      className="text-xs text-neutral-500 hover:text-red-400"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
