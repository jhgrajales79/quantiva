"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCompact } from "@/lib/format";

interface FundamentalsResponse {
  fundamentals: { totalDebt: number | null; cash: number | null; ebitda: number | null };
}

export function FinancialHealthCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalsResponse | null>(null);

  useEffect(() => {
    fetch(`/api/fundamentals/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  const totalDebt = data?.fundamentals.totalDebt ?? null;
  const cash = data?.fundamentals.cash ?? null;
  const ebitda = data?.fundamentals.ebitda ?? null;
  const netDebt = totalDebt !== null && cash !== null ? totalDebt - cash : null;
  const netDebtToEbitda = netDebt !== null && ebitda ? netDebt / ebitda : null;

  return (
    <Card>
      <CardHeader title="Salud financiera" />
      {!data ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-app-fg-muted">Efectivo y equivalentes</dt>
          <dd className="text-right text-app-fg">{formatCompact(cash)}</dd>
          <dt className="text-app-fg-muted">Deuda neta</dt>
          <dd className="text-right text-app-fg">{formatCompact(netDebt)}</dd>
          <dt className="text-app-fg-muted">Deuda neta / EBITDA</dt>
          <dd className="text-right text-app-fg">
            {netDebtToEbitda !== null ? `${netDebtToEbitda.toFixed(2)}x` : "Dato no disponible"}
          </dd>
        </dl>
      )}
    </Card>
  );
}
