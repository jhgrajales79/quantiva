import { NextResponse } from "next/server";
import { getEconomicCalendar } from "@/lib/providers/yahoo-economic-calendar";

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
    const events = await getEconomicCalendar(from, to);
    return NextResponse.json({
      events,
      source: "Yahoo Finance (calendario económico público)",
      note: "La fuente no expone consenso/estimado de mercado, solo valor previo y valor real una vez publicado.",
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
