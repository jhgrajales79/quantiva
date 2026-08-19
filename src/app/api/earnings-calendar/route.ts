import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWatchlistSymbols } from "@/lib/watchlist";
import { getPortfolioSymbols } from "@/lib/portfolio-symbols";
import { getUpcomingEarnings } from "@/lib/earnings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [watchlistSymbols, portfolioSymbols] = await Promise.all([
    getWatchlistSymbols(session.user.id),
    getPortfolioSymbols(session.user.id),
  ]);

  const symbols = [...new Set([...watchlistSymbols, ...portfolioSymbols])];

  if (symbols.length === 0) {
    return NextResponse.json({ events: [] });
  }

  const results = await Promise.all(
    symbols.map((symbol) => getUpcomingEarnings(symbol).catch(() => null)),
  );

  const events = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.reportDate.localeCompare(b.reportDate));

  return NextResponse.json({ events });
}
