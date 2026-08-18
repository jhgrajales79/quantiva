import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { portfolios, portfolioTransactions } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { computeHoldings } from "@/lib/portfolio";
import { newId } from "@/lib/id";

async function assertOwnership(portfolioId: string, userId: string) {
  const [portfolio] = await db
    .select()
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  return portfolio;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const portfolio = await assertOwnership(id, session.user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portafolio no encontrado" }, { status: 404 });
  }

  const holdings = await computeHoldings(id);

  const totalCapitalInvested = holdings.reduce((sum, h) => sum + h.capitalInvested, 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
  const totalUnrealizedPnl = holdings.reduce((sum, h) => sum + (h.unrealizedPnl ?? 0), 0);
  const totalRealizedPnl = holdings.reduce((sum, h) => sum + h.realizedPnl, 0);
  const totalDividends = holdings.reduce((sum, h) => sum + h.dividendsReceived, 0);
  const totalReturnPct =
    totalCapitalInvested > 0
      ? (totalUnrealizedPnl + totalRealizedPnl + totalDividends) / totalCapitalInvested
      : null;

  return NextResponse.json({
    portfolio,
    holdings,
    summary: {
      totalCapitalInvested,
      totalCurrentValue,
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalDividends,
      totalReturnPct,
    },
  });
}

const txSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["buy", "sell", "dividend"]),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  fees: z.number().nonnegative().default(0),
  executedAt: z.string().datetime().or(z.string().date()),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const portfolio = await assertOwnership(id, session.user.id);
  if (!portfolio) {
    return NextResponse.json({ error: "Portafolio no encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = txSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const asset = await getOrCreateAsset(parsed.data.symbol.toUpperCase(), "stock");

  const [created] = await db
    .insert(portfolioTransactions)
    .values({
      id: newId("tx"),
      portfolioId: id,
      assetId: asset.id,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      price: parsed.data.price,
      fees: parsed.data.fees,
      executedAt: new Date(parsed.data.executedAt),
    })
    .returning();

  return NextResponse.json({ transaction: created });
}
