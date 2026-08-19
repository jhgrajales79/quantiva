"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { HistoricalComparisonRow, type ComparisonData } from "./HistoricalComparisonRow";
import { formatPercent } from "@/lib/format";

interface HistoricalComparisons {
  pe: ComparisonData;
  evEbitda: ComparisonData;
  ps: ComparisonData;
  pb: ComparisonData;
  fcfYield: ComparisonData;
}

export function ValuationVsHistoryTable({ symbol }: { symbol: string }) {
  const [data, setData] = useState<HistoricalComparisons | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json?.historicalComparisons ?? null))
      .catch(() => setData(null));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Valoración vs. promedio histórico propio" />
      {!data ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : (
        <div className="divide-y divide-app-border">
          <HistoricalComparisonRow label="P/E" data={data.pe} formatValue={(v) => v.toFixed(1) + "x"} />
          <HistoricalComparisonRow label="EV/EBITDA" data={data.evEbitda} formatValue={(v) => v.toFixed(1) + "x"} />
          <HistoricalComparisonRow label="P/S" data={data.ps} formatValue={(v) => v.toFixed(1) + "x"} />
          <HistoricalComparisonRow label="P/Book" data={data.pb} formatValue={(v) => v.toFixed(1) + "x"} />
          <HistoricalComparisonRow
            label="FCF Yield"
            data={data.fcfYield}
            formatValue={(v) => formatPercent(v)}
            higherIsBetter
          />
        </div>
      )}
    </Card>
  );
}
