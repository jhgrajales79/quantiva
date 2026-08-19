"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { HistoricalComparisonRow, type ComparisonData } from "./HistoricalComparisonRow";
import { formatPercent } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

interface HistoricalComparisons {
  roe: ComparisonData;
  roic: ComparisonData;
  operatingMargin: ComparisonData;
  fcfMargin: ComparisonData;
}

export function ProfitabilityVsHistoryTable({ symbol }: { symbol: string }) {
  const [data, setData] = useState<HistoricalComparisons | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json?.historicalComparisons ?? null))
      .catch(() => setData(null));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Rentabilidad vs. promedio histórico propio" />
      {!data ? (
        <Spinner />
      ) : (
        <div className="divide-y divide-app-border">
          <HistoricalComparisonRow label="ROE" data={data.roe} formatValue={(v) => formatPercent(v)} higherIsBetter />
          <HistoricalComparisonRow label="ROIC" data={data.roic} formatValue={(v) => formatPercent(v)} higherIsBetter />
          <HistoricalComparisonRow
            label="Margen operativo"
            data={data.operatingMargin}
            formatValue={(v) => formatPercent(v)}
            higherIsBetter
          />
          <HistoricalComparisonRow
            label="Margen FCF"
            data={data.fcfMargin}
            formatValue={(v) => formatPercent(v)}
            higherIsBetter
          />
        </div>
      )}
    </Card>
  );
}
