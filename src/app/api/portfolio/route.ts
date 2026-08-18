import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { portfolios } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(portfolios)
    .where(eq(portfolios.userId, session.user.id));

  return NextResponse.json({ portfolios: items });
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
