import { NextResponse } from "next/server";
import { getEarningsCalendar } from "@/lib/providers/yahoo-earnings-calendar";
import { batchGetQuotes } from "@/lib/providers/yahoo-batch-quote";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "Faltan los parámetros from y to" }, { status: 400 });
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
  }

  try {
    const events = await getEarningsCalendar(from, to);
    const symbols = [...new Set(events.map((e) => e.symbol))];

    let quotesBySymbol = new Map<string, { price: number | null; changePct: number | null; marketCap: number | null }>();
    if (symbols.length > 0) {
      try {
        const quotes = await batchGetQuotes(symbols);
        quotesBySymbol = new Map(
          quotes.map((q) => [
            q.symbol,
            {
              price: q.regularMarketPrice,
              changePct: q.regularMarketChangePercent,
              marketCap: q.marketCap,
            },
          ]),
        );
      } catch {
        // si falla el batch de cotizaciones, se sirven los eventos sin precio/cap
      }
    }

    const enriched = events.map((e) => ({
      ...e,
      ...(quotesBySymbol.get(e.symbol) ?? { price: null, changePct: null, marketCap: null }),
    }));

    return NextResponse.json({
      events: enriched,
      source: "Yahoo Finance (calendario de resultados público)",
      note: "La fuente no expone ingresos actual/estimado (solo BPA/EPS); 'Ingresos vs. Est.' muestra 'Dato no disponible'.",
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
