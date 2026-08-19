"use client";

import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useQuotes } from "@/lib/useQuotes";
import type { MarketSymbol } from "@/lib/market-symbols";

export function QuoteStatGrid({ symbols }: { symbols: MarketSymbol[] }) {
  const rows = useQuotes(symbols);

  if (symbols.length === 0) {
    return <p className="text-sm text-app-fg-muted">Sin instrumentos configurados.</p>;
  }
  if (!rows) {
    return <p className="text-sm text-app-fg-muted">Cargando...</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {rows.map((row) => (
        <StatCard
          key={row.symbol}
          label={row.label}
          href={`/stocks/${row.symbol}`}
          value={row.error ? "—" : formatCurrency(row.price)}
          deltaLabel={row.error ? "Dato no disponible" : formatPercent(row.changePct)}
          deltaPositive={row.error ? null : row.changePct !== null ? row.changePct >= 0 : null}
        />
      ))}
    </div>
  );
}
