import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { dashboardPreferences } from "@/lib/db/schema";
import { DEFAULT_DASHBOARD_WIDGETS, sanitizeWidgetList } from "@/lib/dashboard-widgets";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [pref] = await db
    .select()
    .from(dashboardPreferences)
    .where(eq(dashboardPreferences.userId, session.user.id))
    .limit(1);

  return NextResponse.json({ widgets: pref?.widgets ?? DEFAULT_DASHBOARD_WIDGETS });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const widgets = sanitizeWidgetList(body?.widgets);

  await db
    .insert(dashboardPreferences)
    .values({ userId: session.user.id, widgets, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: dashboardPreferences.userId,
      set: { widgets, updatedAt: new Date() },
    });

  return NextResponse.json({ widgets });
}
