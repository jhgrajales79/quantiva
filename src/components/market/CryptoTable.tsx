"use client";

import { useEffect, useState } from "react";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import type { CryptoQuote } from "@/lib/providers/types";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";

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
    return <Spinner label="Cargando criptomonedas..." className="p-4" />;
  }

  return (
    <Table>
      <Thead>
        <Th>Activo</Th>
        <Th align="right">Precio</Th>
        <Th align="right">24h</Th>
        <Th align="right">Market Cap</Th>
        <Th align="right">Volumen 24h</Th>
      </Thead>
      <Tbody>
        {coins.map((coin) => (
          <Tr key={coin.symbol}>
            <Td className="font-medium">
              {coin.name} <span className="text-xs text-app-fg-muted">{coin.symbol}</span>
            </Td>
            <Td align="right">{formatCurrency(coin.price)}</Td>
            <Td
              align="right"
              className={
                coin.change24hPct === null
                  ? "text-app-fg-muted"
                  : coin.change24hPct >= 0
                    ? "text-positive"
                    : "text-negative"
              }
            >
              {formatPercent(coin.change24hPct ? coin.change24hPct / 100 : null)}
            </Td>
            <Td align="right">{formatCompact(coin.marketCap)}</Td>
            <Td align="right">{formatCompact(coin.volume24h)}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
