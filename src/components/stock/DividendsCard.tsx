"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { Coins } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface DividendsResponse {
  dpsTtm: number | null;
  cagr5y: number | null;
  cagr10y: number | null;
  history: { exDate: string; amount: number }[];
}

interface RatiosResponse {
  ratios: { dividendYield: number | null } | null;
}

export function DividendsCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<DividendsResponse | null>(null);
  const [ratios, setRatios] = useState<RatiosResponse | null>(null);

  useEffect(() => {
    fetch(`/api/dividends/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setRatios)
      .catch(() => setRatios(null));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Dividendos" />
      {!data ? (
        <Spinner />
      ) : data.history.length === 0 ? (
        <EmptyState icon={Coins} message="Esta empresa no reparte dividendos, o no hay historial disponible." />
      ) : (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-app-fg-muted">DPS TTM</dt>
          <dd className="text-right text-app-fg">{formatCurrency(data.dpsTtm)}</dd>
          <dt className="text-app-fg-muted">Rendimiento (yield)</dt>
          <dd className="text-right text-app-fg">{formatPercent(ratios?.ratios?.dividendYield ?? null)}</dd>
          <dt className="text-app-fg-muted">DPS CAGR 5A</dt>
          <dd className="text-right text-app-fg">
            {data.cagr5y !== null ? formatPercent(data.cagr5y) : "Historial insuficiente"}
          </dd>
          <dt className="text-app-fg-muted">DPS CAGR 10A</dt>
          <dd className="text-right text-app-fg">
            {data.cagr10y !== null ? formatPercent(data.cagr10y) : "Historial insuficiente"}
          </dd>
        </dl>
      )}
    </Card>
  );
}
