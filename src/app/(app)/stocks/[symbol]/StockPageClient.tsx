"use client";

import { useEffect, useState } from "react";
import { StockHeader } from "@/components/stock/StockHeader";
import { ValuationSummaryCards } from "@/components/stock/ValuationSummaryCards";
import { StockWidgets } from "@/components/stock/StockWidgets";

export function StockPageClient({ symbol }: { symbol: string }) {
  const [possibleValueTrap, setPossibleValueTrap] = useState(false);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPossibleValueTrap(Boolean(data?.possibleValueTrap)))
      .catch(() => setPossibleValueTrap(false));
  }, [symbol]);

  return (
    <div className="space-y-6">
      <StockHeader symbol={symbol} />

      <div id="widget-valuation-summary">
        <ValuationSummaryCards symbol={symbol} />
      </div>

      {possibleValueTrap && (
        <div className="rounded-md border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-300">
          ⚠️ Possible Value Trap: la acción parece barata, pero presenta señales de deterioro
          fundamental (caída de ingresos, FCF negativo o deuda elevada).
        </div>
      )}

      <StockWidgets symbol={symbol} />
    </div>
  );
}
