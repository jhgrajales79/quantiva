import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { portfolios } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { computeHoldings } from "@/lib/portfolio";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, session.user.id));

  // Agregado en vivo a través de todos los portafolios del usuario, para la
  // card de resumen del dashboard. Se calcula en paralelo (no en un loop
  // secuencial) — mismo patrón aplicado tras el bug de rendimiento de movers.
  const holdingsPerPortfolio = await Promise.all(
    items.map((p) => computeHoldings(p.id)),
  );

  const summary = holdingsPerPortfolio.flat().reduce(
    (acc, h) => ({
      totalCurrentValue: acc.totalCurrentValue + (h.currentValue ?? 0),
      totalUnrealizedPnl: acc.totalUnrealizedPnl + (h.unrealizedPnl ?? 0),
    }),
    { totalCurrentValue: 0, totalUnrealizedPnl: 0 },
  );

  return NextResponse.json({
    portfolios: items,
    summary: {
      totalPortfolios: items.length,
      ...summary,
    },
  });
}

const createSchema = z.object({
  name: z.string().min(1),
  baseCurrency: z.string().min(3).max(3).default("USD"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const [created] = await db
    .insert(portfolios)
    .values({
      id: newId("pf"),
      userId: session.user.id,
      name: parsed.data.name,
      baseCurrency: parsed.data.baseCurrency,
    })
    .returning();

  return NextResponse.json({ portfolio: created });
}
