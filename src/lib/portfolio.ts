import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { assets, portfolios, portfolioTransactions } from "@/lib/db/schema";
import { getFreshQuote } from "@/lib/prices";

export async function assertPortfolioOwnership(portfolioId: string, userId: string) {
  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  return portfolio;
}

export interface HoldingSummary {
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
  weightPct: number | null; // se completa después de tener el total del portafolio
}

/**
 * Reconstruye posiciones actuales a partir del historial de transacciones
 * usando costo promedio ponderado (weighted average cost), el método más
 * simple y auditable para un MVP. No usa FIFO/LIFO todavía.
 */
export async function computeHoldings(portfolioId: string): Promise<HoldingSummary[]> {
  const txs = await db
    .select({
      type: portfolioTransactions.type,
      quantity: portfolioTransactions.quantity,
      price: portfolioTransactions.price,
      fees: portfolioTransactions.fees,
      executedAt: portfolioTransactions.executedAt,
      symbol: assets.symbol,
      name: assets.name,
      assetId: assets.id,
    })
    .from(portfolioTransactions)
    .innerJoin(assets, eq(assets.id, portfolioTransactions.assetId))
    .where(eq(portfolioTransactions.portfolioId, portfolioId))
    .orderBy(asc(portfolioTransactions.executedAt));

  const byAsset = new Map<
    string,
    {
      symbol: string;
      name: string;
      assetId: string;
      quantity: number;
      averageCost: number;
      realizedPnl: number;
      dividendsReceived: number;
    }
  >();

  for (const tx of txs) {
    const position =
      byAsset.get(tx.assetId) ??
      {
        symbol: tx.symbol,
        name: tx.name,
        assetId: tx.assetId,
        quantity: 0,
        averageCost: 0,
        realizedPnl: 0,
        dividendsReceived: 0,
      };

    if (tx.type === "buy") {
      const totalCostBefore = position.quantity * position.averageCost;
      const newQuantity = position.quantity + tx.quantity;
      const totalCostAfter = totalCostBefore + tx.quantity * tx.price + tx.fees;
      position.quantity = newQuantity;
      position.averageCost = newQuantity > 0 ? totalCostAfter / newQuantity : 0;
    } else if (tx.type === "sell") {
      const proceeds = tx.quantity * tx.price - tx.fees;
      const costBasis = tx.quantity * position.averageCost;
      position.realizedPnl += proceeds - costBasis;
      position.quantity -= tx.quantity;
    } else if (tx.type === "dividend") {
      position.dividendsReceived += tx.quantity * tx.price;
    }

    byAsset.set(tx.assetId, position);
  }

  const holdings: HoldingSummary[] = [];

  for (const position of byAsset.values()) {
    if (position.quantity <= 0 && position.realizedPnl === 0 && position.dividendsReceived === 0) {
      continue;
    }

    const quote = await getFreshQuote(position.symbol, position.assetId);

    const currentPrice = quote?.price ?? null;
    const capitalInvested = position.quantity * position.averageCost;
    const currentValue =
      currentPrice !== null ? position.quantity * currentPrice : null;
    const unrealizedPnl =
      currentValue !== null ? currentValue - capitalInvested : null;
    const unrealizedPnlPct =
      unrealizedPnl !== null && capitalInvested > 0 ? unrealizedPnl / capitalInvested : null;

    holdings.push({
      symbol: position.symbol,
      name: position.name,
      quantity: position.quantity,
      averageCost: position.averageCost,
      capitalInvested,
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPct,
      realizedPnl: position.realizedPnl,
      dividendsReceived: position.dividendsReceived,
      weightPct: null,
    });
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
  for (const h of holdings) {
    h.weightPct = totalValue > 0 && h.currentValue !== null ? h.currentValue / totalValue : null;
  }

  return holdings;
}

export interface PortfolioTransactionRow {
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

// Historial crudo de transacciones (a diferencia de computeHoldings, que las
// agrega por activo) — necesario para poder editar/eliminar una transacción
// puntual en vez de solo la posición consolidada.
export async function listTransactions(portfolioId: string): Promise<PortfolioTransactionRow[]> {
  const rows = await db
    .select({
      id: portfolioTransactions.id,
      assetId: portfolioTransactions.assetId,
      symbol: assets.symbol,
      name: assets.name,
      type: portfolioTransactions.type,
      quantity: portfolioTransactions.quantity,
      price: portfolioTransactions.price,
      fees: portfolioTransactions.fees,
      executedAt: portfolioTransactions.executedAt,
    })
    .from(portfolioTransactions)
    .innerJoin(assets, eq(assets.id, portfolioTransactions.assetId))
    .where(eq(portfolioTransactions.portfolioId, portfolioId))
    .orderBy(desc(portfolioTransactions.executedAt));

  return rows.map((r) => ({ ...r, executedAt: r.executedAt.toISOString() }));
}
