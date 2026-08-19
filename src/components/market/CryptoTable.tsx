"use client";

import { useEffect, useState } from "react";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import type { CryptoQuote } from "@/lib/providers/types";

export function CryptoTable() {
  const [coins, setCoins] = useState<CryptoQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crypto?limit=15")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Dato no disponible");
        }
        return res.json();
      })
      .then((data) => setCoins(data.coins))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>;
  }
  if (!coins) {
    return <p className="text-sm text-app-fg-muted">Cargando criptomonedas...</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-app-border bg-app-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
            <th className="px-3 py-2">Activo</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2">24h</th>
            <th className="px-3 py-2">Market Cap</th>
            <th className="px-3 py-2">Volumen 24h</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr key={coin.symbol} className="border-b border-app-border hover:bg-app-surface-2/40">
              <td className="px-3 py-2 font-medium">
                {coin.name} <span className="text-xs text-app-fg-muted">{coin.symbol}</span>
              </td>
              <td className="px-3 py-2">{formatCurrency(coin.price)}</td>
              <td
                className={`px-3 py-2 ${
                  coin.change24hPct === null
                    ? "text-app-fg-muted"
                    : coin.change24hPct >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                }`}
              >
                {formatPercent(coin.change24hPct ? coin.change24hPct / 100 : null)}
              </td>
              <td className="px-3 py-2">{formatCompact(coin.marketCap)}</td>
              <td className="px-3 py-2">{formatCompact(coin.volume24h)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
