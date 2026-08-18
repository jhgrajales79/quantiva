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
