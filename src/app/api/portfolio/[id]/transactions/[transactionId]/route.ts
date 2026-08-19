import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { portfolioTransactions } from "@/lib/db/schema";
import { assertPortfolioOwnership } from "@/lib/portfolio";

const updateSchema = z.object({
  type: z.enum(["buy", "sell", "dividend"]).optional(),
  quantity: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  executedAt: z.string().datetime().or(z.string().date()).optional(),
});

async function findOwnedTransaction(portfolioId: string, transactionId: string, userId: string) {
  const portfolio = await assertPortfolioOwnership(portfolioId, userId);
  if (!portfolio) return { portfolio: null, transaction: null };

  const [transaction] = await db
    .select()
    .from(portfolioTransactions)
    .where(
      and(
        eq(portfolioTransactions.id, transactionId),
        eq(portfolioTransactions.portfolioId, portfolioId),
      ),
    )
    .limit(1);

  return { portfolio, transaction: transaction ?? null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, transactionId } = await params;
  const { transaction } = await findOwnedTransaction(id, transactionId, session.user.id);
  if (!transaction) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { executedAt, ...rest } = parsed.data;

  const [updated] = await db
    .update(portfolioTransactions)
    .set({
      ...rest,
      ...(executedAt ? { executedAt: new Date(executedAt) } : {}),
    })
    .where(eq(portfolioTransactions.id, transactionId))
    .returning();

  return NextResponse.json({ transaction: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id, transactionId } = await params;
  const { transaction } = await findOwnedTransaction(id, transactionId, session.user.id);
  if (!transaction) {
    return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
  }

  await db.delete(portfolioTransactions).where(eq(portfolioTransactions.id, transactionId));

  return NextResponse.json({ success: true });
}
