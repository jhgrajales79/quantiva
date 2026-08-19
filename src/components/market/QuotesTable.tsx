"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";

interface QuoteRow {
  symbol: string;
  label: string;
  price: number | null;
  changePct: number | null;
  error?: string;
}

export function QuotesTable({ symbols }: { symbols: { symbol: string; label: string }[] }) {
  const [rows, setRows] = useState<QuoteRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all(
      symbols.map(async ({ symbol, label }) => {
        try {
          const res = await fetch(`/api/quotes/${symbol}`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { symbol, label, price: null, changePct: null, error: body.error ?? "Dato no disponible" };
          }
          const data = await res.json();
          return { symbol, label, price: data.price, changePct: data.changePct };
        } catch {
          return { symbol, label, price: null, changePct: null, error: "Dato no disponible" };
        }
      }),
    ).then((results) => {
      if (mounted) setRows(results);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols)]);

  if (!rows) {
    return <p className="text-sm text-app-fg-muted">Cargando cotizaciones...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-app-border bg-app-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
            <th className="px-3 py-2">Instrumento</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">Var.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol} className="border-b border-app-border hover:bg-app-surface-2/40">
              <td className="px-3 py-2">
                <Link href={`/stocks/${row.symbol}`} className="font-medium hover:underline">
                  {row.label}
                </Link>
                <span className="ml-1 text-xs text-app-fg-muted">{row.symbol}</span>
              </td>
              <td className="px-3 py-2">
                {row.error ? (
                  <span className="text-xs text-app-fg-muted">Dato no disponible</span>
                ) : (
                  formatCurrency(row.price)
                )}
              </td>
              <td
                className={`px-3 py-2 ${
                  row.changePct === null
                    ? "text-app-fg-muted"
                    : row.changePct >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                }`}
              >
                {formatPercent(row.changePct === null ? null : row.changePct / 100)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
