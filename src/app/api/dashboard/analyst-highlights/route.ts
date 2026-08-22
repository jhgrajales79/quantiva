import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWatchlistSymbols } from "@/lib/watchlist";
import { getAnalystHighlights } from "@/lib/analyst-highlights";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const watchlistSymbols = await getWatchlistSymbols(session.user.id);
  const highlights = await getAnalystHighlights(watchlistSymbols, 3);

  return NextResponse.json({ highlights, source: "Yahoo Finance" });
}
