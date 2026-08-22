"use client";

import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useQuotes } from "@/lib/useQuotes";
import type { MarketSymbol } from "@/lib/market-symbols";

export function QuoteStatGrid({ symbols }: { symbols: MarketSymbol[] }) {
  const rows = useQuotes(symbols);

  if (symbols.length === 0) {
    return <p className="text-sm text-app-fg-muted">Sin instrumentos configurados.</p>;
  }
  if (!rows) {
    // El número final de tarjetas ya se conoce (symbols.length) — mostrar
    // esa misma grilla con placeholders evita el salto de layout que deja
    // un spinner centrado y comunica mejor qué está cargando.
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {symbols.map((s) => (
          <Card key={s.symbol}>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="mt-2 h-5 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </Card>
        ))}
      </div>
    );
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
          extra={
            row.extendedHours && (
              <p className="mt-0.5 text-xs tabular-nums text-info">
                {row.extendedHours.label} {formatCurrency(row.extendedHours.price)}
              </p>
            )
          }
        />
      ))}
    </div>
  );
}
