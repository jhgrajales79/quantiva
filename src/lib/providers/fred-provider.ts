import { z } from "zod";
import type { MacroDataProvider, MacroSeriesPoint } from "./types";

const FRED_BASE_URL = "https://api.stlouisfed.org/fred/series/observations";

const observationSchema = z.object({
  date: z.string(),
  value: z.string(), // FRED returns numbers as strings; "." means missing
});

const responseSchema = z.object({
  observations: z.array(observationSchema),
});

// DFEDTARU/DFEDTARL (rango objetivo del FOMC) se publican como serie diaria
// que solo cambia ~8 veces al año (en cada reunión) — pedir las últimas 24
// observaciones diarias sin más solo cubriría unas semanas, no el último
// año que necesita el sparkline. Se agregan a fin de mes (eop, no promedio,
// para no diluir un cambio de tasa dentro del mes) para que se comporten
// igual que el resto de series mensuales del dashboard.
const MONTHLY_AGGREGATED_DAILY_SERIES = new Set(["DFEDTARU", "DFEDTARL"]);

/**
 * Common series codes used by the Macro Dashboard:
 * CPIAUCSL (CPI), CPILFESL (Core CPI), GDPC1 (Real GDP), UNRATE (Unemployment),
 * PAYEMS (Non-Farm Payrolls), FEDFUNDS (Fed Funds Rate), DGS2 / DGS10 (Treasury 2Y/10Y),
 * UMCSENT (Consumer Sentiment), HOUST (Housing Starts), RSAFS (Retail Sales).
 */
export class FredProvider implements MacroDataProvider {
  readonly name = "Federal Reserve Economic Data (FRED)";

  async getSeries(code: string): Promise<MacroSeriesPoint[]> {
    const apiKey = process.env.FRED_API_KEY;
    if (!apiKey) {
      throw new Error(
        "FRED_API_KEY no está configurada. Este indicador macro no se puede obtener sin credenciales del proveedor.",
      );
    }

    const url = new URL(FRED_BASE_URL);
    url.searchParams.set("series_id", code);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("file_type", "json");
    url.searchParams.set("sort_order", "desc");
    url.searchParams.set("limit", "24");
    if (MONTHLY_AGGREGATED_DAILY_SERIES.has(code)) {
      url.searchParams.set("frequency", "m");
      url.searchParams.set("aggregation_method", "eop");
    }

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`FRED request failed: ${res.status} ${res.statusText} (series ${code})`);
    }

    const json = await res.json();
    const parsed = responseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`FRED response validation failed for ${code}: ${parsed.error.message}`);
    }

    return parsed.data.observations
      .filter((obs) => obs.value !== ".")
      .map((obs) => ({ date: obs.date, value: Number(obs.value) }));
  }
}
