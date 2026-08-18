import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { assets, watchlistItems } from "@/lib/db/schema";
import { getOrCreateAsset } from "@/lib/assets";
import { getOrCreateDefaultWatchlist } from "@/lib/watchlist";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const watchlist = await getOrCreateDefaultWatchlist(session.user.id);

  const items = await db
    .select({ symbol: assets.symbol, name: assets.name, assetType: assets.assetType })
    .from(watchlistItems)
    .innerJoin(assets, eq(assets.id, watchlistItems.assetId))
    .where(eq(watchlistItems.watchlistId, watchlist.id));

  return NextResponse.json({ watchlistId: watchlist.id, items });
}

const addSchema = z.object({ symbol: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Símbolo inválido" }, { status: 400 });
  }

  const watchlist = await getOrCreateDefaultWatchlist(session.user.id);
  const asset = await getOrCreateAsset(parsed.data.symbol.toUpperCase(), "stock");

  await db
    .insert(watchlistItems)
    .values({ watchlistId: watchlist.id, assetId: asset.id })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: "Símbolo requerido" }, { status: 400 });
  }

  const watchlist = await getOrCreateDefaultWatchlist(session.user.id);
  const [asset] = await db.select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
  if (!asset) {
    return NextResponse.json({ ok: true });
  }

  await db
    .delete(watchlistItems)
    .where(
      and(eq(watchlistItems.watchlistId, watchlist.id), eq(watchlistItems.assetId, asset.id)),
    );

  return NextResponse.json({ ok: true });
}
