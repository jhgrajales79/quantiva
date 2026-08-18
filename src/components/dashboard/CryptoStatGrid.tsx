"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { CryptoQuote } from "@/lib/providers/types";

export function CryptoStatGrid() {
  const [coins, setCoins] = useState<CryptoQuote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crypto?limit=6")
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

  if (error) return <p className="text-sm text-neutral-500">Dato no disponible: {error}</p>;
  if (!coins) return <p className="text-sm text-neutral-500">Cargando...</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {coins.map((coin) => (
        <StatCard
          key={coin.symbol}
          label={`${coin.name} (${coin.symbol})`}
          value={formatCurrency(coin.price)}
          deltaLabel={formatPercent(coin.change24hPct ? coin.change24hPct / 100 : null)}
          deltaPositive={coin.change24hPct !== null ? coin.change24hPct >= 0 : null}
        />
      ))}
    </div>
  );
}
