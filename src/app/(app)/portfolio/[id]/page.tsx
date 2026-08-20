"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { Pencil, Trash2 } from "lucide-react";
import { useTickerSearch, TickerSuggestions } from "@/components/ui/TickerSearch";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Dialog } from "@/components/ui/Dialog";

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

interface Transaction {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  type: "buy" | "sell" | "dividend";
  quantity: number;
  price: number;
  fees: number;
  executedAt: string;
}

interface Summary {
  totalCapitalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalDividends: number;
  totalReturnPct: number | null;
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  buy: "Compra",
  sell: "Venta",
  dividend: "Dividendo",
};

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const [holdings, setHoldings] = useState<Holding[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const { results: suggestions } = useTickerSearch(suggestOpen ? form.symbol : "");

  async function load() {
    const res = await fetch(`/api/portfolio/${params.id}/transactions`);
    if (!res.ok) {
      setError("No se pudo cargar el portafolio.");
      return;
    }
    const data = await res.json();
    setHoldings(data.holdings);
    setTransactions(data.transactions);
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

  async function handleDeleteTx(tx: Transaction) {
    if (!confirm(`¿Eliminar la transacción de ${tx.symbol} (${TYPE_LABELS[tx.type]})? Esta acción no se puede deshacer.`)) {
      return;
    }
    await fetch(`/api/portfolio/${params.id}/transactions/${tx.id}`, { method: "DELETE" });
    load();
  }

  async function handleSaveEdit(updated: {
    type: Transaction["type"];
    quantity: number;
    price: number;
    fees: number;
    executedAt: string;
  }) {
    if (!editingTx) return;
    const res = await fetch(`/api/portfolio/${params.id}/transactions/${editingTx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo actualizar la transacción.");
      return;
    }
    setEditingTx(null);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={portfolioName || "Portafolio"} />

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

      <div className="rounded-card border border-app-border bg-app-surface shadow-card">
        <h3 className="border-b border-app-border p-3 text-sm font-semibold text-app-fg">
          Posiciones
        </h3>
        {!holdings ? (
          <Spinner className="p-4" />
        ) : holdings.length === 0 ? (
          <p className="p-4 text-sm text-app-fg-muted">
            Sin posiciones todavía. Registra tu primera transacción abajo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <Thead>
                <Th>Ticker</Th>
                <Th>Cantidad</Th>
                <Th>Costo prom.</Th>
                <Th>Precio actual</Th>
                <Th>Valor actual</Th>
                <Th>P&L no realiz.</Th>
                <Th>Peso</Th>
              </Thead>
              <Tbody>
                {holdings.map((h) => (
                  <Tr key={h.symbol}>
                    <Td className="font-medium">{h.symbol}</Td>
                    <Td>{h.quantity}</Td>
                    <Td>{formatCurrency(h.averageCost)}</Td>
                    <Td>{formatCurrency(h.currentPrice)}</Td>
                    <Td>{formatCurrency(h.currentValue)}</Td>
                    <Td
                      className={
                        h.unrealizedPnl === null
                          ? "text-app-fg-muted"
                          : h.unrealizedPnl >= 0
                            ? "text-positive"
                            : "text-negative"
                      }
                    >
                      {formatCurrency(h.unrealizedPnl)} ({formatPercent(h.unrealizedPnlPct)})
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-pill bg-app-surface-2">
                          <div
                            className="h-full rounded-pill bg-brand"
                            style={{ width: `${Math.max(0, Math.min(100, (h.weightPct ?? 0) * 100))}%` }}
                          />
                        </div>
                        <span className="whitespace-nowrap text-xs tabular-nums text-app-fg-muted">
                          {formatPercent(h.weightPct)}
                        </span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-card border border-app-border bg-app-surface shadow-card">
        <h3 className="border-b border-app-border p-3 text-sm font-semibold text-app-fg">
          Transacciones
        </h3>
        {!transactions ? (
          <Spinner className="p-4" />
        ) : transactions.length === 0 ? (
          <p className="p-4 text-sm text-app-fg-muted">Sin transacciones todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <Thead>
                <Th>Fecha</Th>
                <Th>Ticker</Th>
                <Th>Tipo</Th>
                <Th>Cantidad</Th>
                <Th>Precio</Th>
                <Th>Comisión</Th>
                <Th align="right">Acciones</Th>
              </Thead>
              <Tbody>
                {transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td className="text-app-fg-muted">{tx.executedAt.slice(0, 10)}</Td>
                    <Td className="font-medium">{tx.symbol}</Td>
                    <Td>{TYPE_LABELS[tx.type]}</Td>
                    <Td>{tx.quantity}</Td>
                    <Td>{formatCurrency(tx.price)}</Td>
                    <Td>{formatCurrency(tx.fees)}</Td>
                    <Td align="right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditingTx(tx)}
                          aria-label="Editar transacción"
                          className="text-app-fg-muted hover:text-app-fg"
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleDeleteTx(tx)}
                          aria-label="Eliminar transacción"
                          className="text-app-fg-muted hover:text-negative"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </table>
          </div>
        )}
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-app-fg">Registrar transacción</h3>
        <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-5">
          <div className="relative">
            <input
              required
              placeholder="Ticker"
              value={form.symbol}
              onChange={(e) => {
                setForm({ ...form, symbol: e.target.value });
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setSuggestOpen(false)}
              className="w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg outline-none focus:border-brand"
            />
            {suggestOpen && (
              <TickerSuggestions
                results={suggestions}
                onSelect={(m) => {
                  setForm({ ...form, symbol: m.symbol });
                  setSuggestOpen(false);
                }}
              />
            )}
          </div>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg outline-none focus:border-brand"
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
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
          <input
            required
            type="number"
            step="any"
            placeholder="Precio"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
          <input
            type="date"
            value={form.executedAt}
            onChange={(e) => setForm({ ...form, executedAt: e.target.value })}
            className="rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="col-span-full rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:col-span-1"
          >
            Registrar
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-negative">{error}</p>}
      </Card>

      {editingTx && (
        <EditTransactionModal
          tx={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function EditTransactionModal({
  tx,
  onClose,
  onSave,
}: {
  tx: Transaction;
  onClose: () => void;
  onSave: (updated: {
    type: Transaction["type"];
    quantity: number;
    price: number;
    fees: number;
    executedAt: string;
  }) => void;
}) {
  const [type, setType] = useState(tx.type);
  const [quantity, setQuantity] = useState(String(tx.quantity));
  const [price, setPrice] = useState(String(tx.price));
  const [fees, setFees] = useState(String(tx.fees));
  const [executedAt, setExecutedAt] = useState(tx.executedAt.slice(0, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      type,
      quantity: Number(quantity),
      price: Number(price),
      fees: Number(fees || 0),
      executedAt: new Date(executedAt).toISOString(),
    });
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()} title={`Editar transacción de ${tx.symbol}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs text-app-fg-muted">
          Tipo
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Transaction["type"])}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg outline-none focus:border-brand"
          >
            <option value="buy">Compra</option>
            <option value="sell">Venta</option>
            <option value="dividend">Dividendo</option>
          </select>
        </label>
        <label className="block text-xs text-app-fg-muted">
          Cantidad
          <input
            required
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
        </label>
        <label className="block text-xs text-app-fg-muted">
          Precio
          <input
            required
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
        </label>
        <label className="block text-xs text-app-fg-muted">
          Comisión
          <input
            type="number"
            step="any"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
        </label>
        <label className="block text-xs text-app-fg-muted">
          Fecha
          <input
            type="date"
            value={executedAt}
            onChange={(e) => setExecutedAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm tabular-nums text-app-fg outline-none focus:border-brand"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-fg hover:bg-app-surface-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </form>
    </Dialog>
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
    <Card>
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p
        className={clsx(
          "text-lg font-semibold tabular-nums",
          positive === undefined ? "text-app-fg" : positive ? "text-positive" : "text-negative",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
