import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { stockWidgetPreferences } from "@/lib/db/schema";
import { DEFAULT_STOCK_WIDGETS, sanitizeStockWidgetList, sanitizeStockWidgetSizes } from "@/lib/stock-widgets";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [pref] = await db
    .select()
    .from(stockWidgetPreferences)
    .where(eq(stockWidgetPreferences.userId, session.user.id))
    .limit(1);

  return NextResponse.json({
    widgets: pref?.widgets ?? DEFAULT_STOCK_WIDGETS,
    sizes: pref?.sizes ?? {},
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const widgets = sanitizeStockWidgetList(body?.widgets);
  const sizes = sanitizeStockWidgetSizes(body?.sizes);

  await db
    .insert(stockWidgetPreferences)
    .values({ userId: session.user.id, widgets, sizes, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: stockWidgetPreferences.userId,
      set: { widgets, sizes, updatedAt: new Date() },
    });

  return NextResponse.json({ widgets, sizes });
}
