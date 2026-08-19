"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

interface FundamentalsResponse {
  fundamentals: {
    revenue: number | null;
    ebit: number | null;
    netIncome: number | null;
    eps: number | null;
    totalDebt: number | null;
    sharesOutstanding: number | null;
    bookValuePerShare: number | null;
  };
  ratios: { fiscalDate: string; grossMargin: number | null; operatingMargin: number | null } | null;
}

interface EarningsResponse {
  reportDate: string;
  daysUntil: number;
}

interface Bar {
  label: string;
  value: number | null;
  color: string;
}

export function EarningsRevenueCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalsResponse | null>(null);
  const [nextEarnings, setNextEarnings] = useState<EarningsResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      fetch(`/api/fundamentals/${symbol}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/earnings-calendar/${symbol}`).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([fund, earn]) => {
        setData(fund);
        setNextEarnings(earn);
      })
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  if (!loaded) {
    return (
      <Card>
        <CardHeader title="Beneficios e ingresos" />
        <Spinner />
      </Card>
    );
  }

  const fund = data?.fundamentals;
  const grossMargin = data?.ratios?.grossMargin ?? null;
  const revenue = fund?.revenue ?? null;
  const ebit = fund?.ebit ?? null;
  const netIncome = fund?.netIncome ?? null;

  const grossProfit = revenue !== null && grossMargin !== null ? revenue * grossMargin : null;
  const costOfRevenue = revenue !== null && grossProfit !== null ? revenue - grossProfit : null;

  // El campo directo de EBIT no siempre viene poblado en Yahoo; cuando falta,
  // se deriva del margen operativo (mismo dato, expresado como ratio en vez
  // de monto) en lugar de mostrar "Otros gastos" como no disponible.
  const operatingMargin = data?.ratios?.operatingMargin ?? null;
  const effectiveEbit = ebit ?? (revenue !== null && operatingMargin !== null ? revenue * operatingMargin : null);
  const otherExpenses = grossProfit !== null && effectiveEbit !== null ? grossProfit - effectiveEbit : null;

  const netMargin = revenue !== null && revenue !== 0 && netIncome !== null ? netIncome / revenue : null;

  const equity =
    fund?.bookValuePerShare !== null && fund?.bookValuePerShare !== undefined && fund?.sharesOutstanding
      ? fund.bookValuePerShare * fund.sharesOutstanding
      : null;
  const debtToEquity =
    fund?.totalDebt !== null && fund?.totalDebt !== undefined && equity !== null && equity !== 0
      ? fund.totalDebt / equity
      : null;

  const bars: Bar[] = [
    { label: "Ingresos", value: revenue, color: "bg-sky-500" },
    { label: "Coste de los ingresos", value: costOfRevenue, color: "bg-red-500" },
    { label: "Beneficio bruto", value: grossProfit, color: "bg-emerald-500" },
    { label: "Otros gastos", value: otherExpenses, color: "bg-red-500" },
    { label: "Beneficios", value: netIncome, color: "bg-teal-400" },
  ];

  const maxAbs = Math.max(1, ...bars.map((b) => Math.abs(b.value ?? 0)));

  if (!fund || revenue === null) {
    return (
      <Card>
        <CardHeader title="Beneficios e ingresos" />
        <p className="text-sm text-app-fg-muted">Dato no disponible</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Beneficios e ingresos" />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="flex h-40 items-end gap-3">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-xs font-medium text-app-fg">
                  {b.value !== null ? formatCompact(b.value) : "—"}
                </span>
                <div
                  className={`w-full rounded-t-sm ${b.color}`}
                  style={{
                    height: b.value !== null ? `${Math.max(4, (Math.abs(b.value) / maxAbs) * 100)}%` : "4px",
                    opacity: b.value === null ? 0.2 : 1,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-center">
            {bars.map((b) => (
              <p key={b.label} className="flex-1 text-xs text-app-fg-muted">
                {b.label}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between gap-3 text-sm">
            <div>
              <p className="text-xs text-app-fg-muted">Último período reportado</p>
              <p className="font-medium text-app-fg">{data?.ratios?.fiscalDate ?? "Dato no disponible"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-app-fg-muted">Próxima fecha de beneficios</p>
              <p className="font-medium text-app-fg">
                {nextEarnings ? `${nextEarnings.reportDate} (en ${nextEarnings.daysUntil}d)` : "No disponible"}
              </p>
            </div>
          </div>

          <dl className="divide-y divide-app-border text-sm">
            <div className="flex justify-between py-1.5">
              <dt className="text-app-fg-muted">Beneficios por acción (BPA)</dt>
              <dd className="font-medium text-app-fg">{formatCurrency(fund.eps)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-app-fg-muted">Margen bruto</dt>
              <dd className="font-medium text-app-fg">{formatPercent(grossMargin)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-app-fg-muted">Margen de beneficio neto</dt>
              <dd className="font-medium text-app-fg">{formatPercent(netMargin)}</dd>
            </div>
            <div className="flex justify-between py-1.5">
              <dt className="text-app-fg-muted">Ratio deuda/patrimonio</dt>
              <dd className="font-medium text-app-fg">{formatPercent(debtToEquity)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}
