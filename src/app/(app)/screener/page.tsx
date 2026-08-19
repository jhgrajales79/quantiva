"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";

interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  pe: number | null;
  forwardPe: number | null;
  pb: number | null;
  dividendYield: number | null;
  roe: number | null;
  investmentScore: number | null;
  upsidePct: number | null;
  qualityCoverage: boolean;
}

interface Filters {
  peMin: string;
  peMax: string;
  marketCapMin: string;
  dividendYieldMin: string;
  sector: string;
  aboveMa50: boolean;
  aboveMa200: boolean;
  near52wHigh: boolean;
}

const EMPTY_FILTERS: Filters = {
  peMin: "",
  peMax: "",
  marketCapMin: "",
  dividendYieldMin: "",
  sector: "",
  aboveMa50: false,
  aboveMa200: false,
  near52wHigh: false,
};

export default function ScreenerPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sectors, setSectors] = useState<string[]>([]);
  const [results, setResults] = useState<ScreenerResult[] | null>(null);
  const [meta, setMeta] = useState<{ date: string | null; universeSize?: number }>({ date: null });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.peMin) params.set("peMin", filters.peMin);
    if (filters.peMax) params.set("peMax", filters.peMax);
    if (filters.marketCapMin) params.set("marketCapMin", filters.marketCapMin);
    if (filters.dividendYieldMin) params.set("dividendYieldMin", (Number(filters.dividendYieldMin) / 100).toString());
    if (filters.sector) params.set("sector", filters.sector);
    if (filters.aboveMa50) params.set("aboveMa50", "true");
    if (filters.aboveMa200) params.set("aboveMa200", "true");
    if (filters.near52wHigh) params.set("near52wHigh", "true");

    setResults(null);
    fetch(`/api/screener?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setResults(data?.results ?? []);
        setSectors(data?.sectors ?? []);
        setMeta({ date: data?.date ?? null, universeSize: data?.universeSize });
      })
      .catch(() => setResults([]));
  }, [filters]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-app-fg">Screener</h1>
        <p className="text-sm text-app-fg-muted">
          Universo: S&amp;P 500 ({meta.universeSize ?? "…"} activos) · datos del{" "}
          {meta.date ?? "…"}. Los filtros de calidad (ROE) y Fair Value solo aplican a los
          activos que ya tienen historial propio en Quantiva — el resto muestra "Sin cobertura"
          en vez de un valor inventado.
        </p>
      </div>

      <Card>
        <CardHeader title="Filtros" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-app-fg-muted">
            P/E mínimo
            <input
              type="number"
              value={filters.peMin}
              onChange={(e) => setFilters({ ...filters, peMin: e.target.value })}
              className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
            />
          </label>
          <label className="text-xs text-app-fg-muted">
            P/E máximo
            <input
              type="number"
              value={filters.peMax}
              onChange={(e) => setFilters({ ...filters, peMax: e.target.value })}
              className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
            />
          </label>
          <label className="text-xs text-app-fg-muted">
            Market cap mínimo (USD)
            <input
              type="number"
              value={filters.marketCapMin}
              onChange={(e) => setFilters({ ...filters, marketCapMin: e.target.value })}
              className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
            />
          </label>
          <label className="text-xs text-app-fg-muted">
            Dividend yield mínimo (%)
            <input
              type="number"
              value={filters.dividendYieldMin}
              onChange={(e) => setFilters({ ...filters, dividendYieldMin: e.target.value })}
              className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
            />
          </label>
          <label className="text-xs text-app-fg-muted">
            Sector
            <select
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
            >
              <option value="">Todos</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3 text-xs text-app-fg-muted">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.aboveMa50}
                onChange={(e) => setFilters({ ...filters, aboveMa50: e.target.checked })}
              />
              Sobre MM50
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.aboveMa200}
                onChange={(e) => setFilters({ ...filters, aboveMa200: e.target.checked })}
              />
              Sobre MM200
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.near52wHigh}
                onChange={(e) => setFilters({ ...filters, near52wHigh: e.target.checked })}
              />
              Cerca máx. 52s
            </label>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        {results === null ? (
          <p className="p-4 text-sm text-app-fg-muted">Cargando...</p>
        ) : results.length === 0 ? (
          <p className="p-4 text-sm text-app-fg-muted">Sin resultados para estos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Sector</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Var.</th>
                  <th className="px-3 py-2">Cap.</th>
                  <th className="px-3 py-2">P/E</th>
                  <th className="px-3 py-2">P/B</th>
                  <th className="px-3 py-2">Div. Yield</th>
                  <th className="px-3 py-2">ROE (propio)</th>
                  <th className="px-3 py-2">Investment Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.symbol} className="border-b border-app-border last:border-0 hover:bg-app-surface-2">
                    <td className="px-3 py-2">
                      <Link href={`/stocks/${r.symbol}`} className="font-medium text-app-fg hover:underline">
                        {r.symbol}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-app-fg-muted">{r.sector ?? "—"}</td>
                    <td className="px-3 py-2">{formatCurrency(r.price)}</td>
                    <td className={r.changePct !== null && r.changePct >= 0 ? "px-3 py-2 text-emerald-400" : "px-3 py-2 text-red-400"}>
                      {formatPercent(r.changePct === null ? null : r.changePct / 100)}
                    </td>
                    <td className="px-3 py-2">{formatCompact(r.marketCap)}</td>
                    <td className="px-3 py-2">{r.pe !== null ? r.pe.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2">{r.pb !== null ? r.pb.toFixed(1) : "—"}</td>
                    <td className="px-3 py-2">{formatPercent(r.dividendYield)}</td>
                    <td className="px-3 py-2">
                      {r.qualityCoverage ? formatPercent(r.roe) : <span className="text-app-fg-faint">Sin cobertura</span>}
                    </td>
                    <td className="px-3 py-2">
                      {r.investmentScore !== null ? r.investmentScore.toFixed(0) : <span className="text-app-fg-faint">Sin cobertura</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
