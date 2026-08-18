import { NextResponse } from "next/server";
import { getDailyPriceHistory } from "@/lib/prices";
import { SECTOR_ETFS } from "@/lib/providers/sector-etfs";
import { computeReturn } from "@/lib/sector-returns";

export async function GET() {
  const results = await Promise.all(
    SECTOR_ETFS.map(async (sector) => {
      try {
        const history = await getDailyPriceHistory(sector.symbol);
        return {
          symbol: sector.symbol,
          label: sector.label,
          returns: {
            "1d": computeReturn(history, "1d"),
            "1w": computeReturn(history, "1w"),
            "1m": computeReturn(history, "1m"),
            ytd: computeReturn(history, "ytd"),
          },
          error: null as string | null,
        };
      } catch (error) {
        return {
          symbol: sector.symbol,
          label: sector.label,
          returns: { "1d": null, "1w": null, "1m": null, ytd: null },
          error: (error as Error).message,
        };
      }
    }),
  );

  return NextResponse.json({ sectors: results, fetchedAt: new Date().toISOString() });
}
