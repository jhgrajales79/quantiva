"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
        <div className="flex items-start gap-2 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            Possible Value Trap: la acción parece barata, pero presenta señales de deterioro
            fundamental (caída de ingresos, FCF negativo o deuda elevada).
          </span>
        </div>
      )}

      <StockWidgets symbol={symbol} />
    </div>
  );
}
