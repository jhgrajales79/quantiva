"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/format";

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  capitalInvested: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  realizedPnl: number;
  dividendsReceived: number;
  weightPct: number | null;
}

interface Summary {
  totalCapitalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalDividends: number;
  totalReturnPct: number | null;
}

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [portfolioName, setPortfolioName] = useState("");
  const [form, setForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell" | "dividend",
    quantity: "",
    price: "",
    fees: "0",
    executedAt: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/portfolio/${params.id}/transactions`);
    if (!res.ok) {
      setError("No se pudo cargar el portafolio.");
      return;
    }
    const data = await res.json();
    setHoldings(data.holdings);
    setSummary(data.summary);
    setPortfolioName(data.portfolio.name);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/portfolio/${params.id}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: form.symbol.toUpperCase(),
        type: form.type,
        quantity: Number(form.quantity),
        price: Number(form.price),
        fees: Number(form.fees || 0),
        executedAt: new Date(form.executedAt).toISOString(),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo registrar la transacción.");
      return;
    }
    setForm({ ...form, symbol: "", quantity: "", price: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-app-fg">{portfolioName || "Portafolio"}</h1>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Capital invertido" value={formatCurrency(summary.totalCapitalInvested)} />
          <SummaryCard label="Valor actual" value={formatCurrency(summary.totalCurrentValue)} />
          <SummaryCard
            label="P&L no realizado"
            value={formatCurrency(summary.totalUnrealizedPnl)}
            positive={summary.totalUnrealizedPnl >= 0}
          />
          <SummaryCard
            label="P&L realizado"
            value={formatCurrency(summary.totalRealizedPnl)}
            positive={summary.totalRealizedPnl >= 0}
          />
          <SummaryCard label="Retorno total" value={formatPercent(summary.totalReturnPct)} />
        </div>
      )}

      <div className="rounded-lg border border-app-border bg-app-surface">
        <h3 className="border-b border-app-border p-3 text-sm font-semibold text-app-fg">
          Posiciones
        </h3>
        {!holdings ? (
          <p className="p-4 text-sm text-app-fg-muted">Cargando...</p>
        ) : holdings.length === 0 ? (
          <p className="p-4 text-sm text-app-fg-muted">
            Sin posiciones todavía. Registra tu primera transacción abajo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Costo prom.</th>
                  <th className="px-3 py-2">Precio actual</th>
                  <th className="px-3 py-2">Valor actual</th>
                  <th className="px-3 py-2">P&L no realiz.</th>
                  <th className="px-3 py-2">Peso</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.symbol} className="border-b border-app-border hover:bg-app-surface-2/40">
                    <td className="px-3 py-2 font-medium">{h.symbol}</td>
                    <td className="px-3 py-2">{h.quantity}</td>
                    <td className="px-3 py-2">{formatCurrency(h.averageCost)}</td>
                    <td className="px-3 py-2">{formatCurrency(h.currentPrice)}</td>
                    <td className="px-3 py-2">{formatCurrency(h.currentValue)}</td>
                    <td
                      className={`px-3 py-2 ${
                        h.unrealizedPnl === null
                          ? "text-app-fg-muted"
                          : h.unrealizedPnl >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                      }`}
                    >
                      {formatCurrency(h.unrealizedPnl)} ({formatPercent(h.unrealizedPnlPct)})
                    </td>
                    <td className="px-3 py-2">{formatPercent(h.weightPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-app-border bg-app-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-app-fg">Registrar transacción</h3>
        <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-5">
          <input
            required
            placeholder="Ticker"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="buy">Compra</option>
            <option value="sell">Venta</option>
            <option value="dividend">Dividendo</option>
          </select>
          <input
            required
            type="number"
            step="any"
            placeholder="Cantidad"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <input
            type="date"
            value={form.executedAt}
            onChange={(e) => setForm({ ...form, executedAt: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="col-span-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 sm:col-span-1"
          >
            Registrar
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-3">
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p
        className={`text-lg font-semibold ${
          positive === undefined ? "text-app-fg" : positive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
