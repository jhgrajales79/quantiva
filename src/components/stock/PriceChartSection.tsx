"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PriceChart } from "@/components/charts/PriceChart";
import { formatPercent } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

type Range = "1M" | "3M" | "6M" | "1A" | "3A" | "5A" | "10A";

const RANGE_DAYS: Record<Range, number> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1A": 365,
  "3A": 365 * 3,
  "5A": 365 * 5,
  "10A": 365 * 10,
};

interface PricePoint {
  date: string;
  close: number;
}

function periodReturn(points: PricePoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].close;
  const last = points[points.length - 1].close;
  if (first === 0) return null;
  return (last - first) / first;
}

export function PriceChartSection({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<Range>("1A");
  const [stockPrices, setStockPrices] = useState<PricePoint[] | null>(null);
  const [spyPrices, setSpyPrices] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    fetch(`/api/prices/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStockPrices(data?.prices ?? []))
      .catch(() => setStockPrices([]));
    fetch(`/api/prices/SPY`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSpyPrices(data?.prices ?? []))
      .catch(() => setSpyPrices([]));
  }, [symbol]);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - RANGE_DAYS[range]);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const filteredStock = useMemo(
    () => (stockPrices ?? []).filter((p) => p.date >= cutoffDate),
    [stockPrices, cutoffDate],
  );
  const filteredSpy = useMemo(
    () => (spyPrices ?? []).filter((p) => p.date >= cutoffDate),
    [spyPrices, cutoffDate],
  );

  const stockReturn = periodReturn(filteredStock);
  const spyReturn = periodReturn(filteredSpy);

  return (
    <Card>
      <CardHeader
        title="Precio de la acción"
        action={
          <div className="flex gap-1">
            {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  range === r ? "bg-app-surface-2 text-app-fg" : "text-app-fg-muted hover:text-app-fg-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        }
      />
      <p className="mb-3 text-xs text-app-fg-muted">
        {symbol} en el período: {stockReturn !== null ? formatPercent(stockReturn) : "Dato no disponible"} · SPY en
        el mismo período: {spyReturn !== null ? formatPercent(spyReturn) : "Dato no disponible"}
      </p>
      {stockPrices === null ? (
        <Spinner />
      ) : (
        <PriceChart
          data={filteredStock}
          compareWith={{ label: "S&P 500 (SPY)", color: "#f59e0b", data: filteredSpy }}
        />
      )}
    </Card>
  );
}
