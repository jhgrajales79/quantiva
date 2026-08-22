"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Thead, Th, Tbody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { GitCompareArrows } from "lucide-react";
import { useTickerSearch, TickerSuggestions } from "@/components/ui/TickerSearch";

interface CompareEntry {
  symbol: string;
  error: string | null;
  companyName: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  pe: number | null;
  ps: number | null;
  pb: number | null;
  evEbitda: number | null;
  dividendYield: number | null;
  roe: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
  epsGrowth: number | null;
  fairValueConsensus: number | null;
  upsidePct: number | null;
  investmentScore: number | null;
  valueScore: number | null;
  qualityScore: number | null;
  growthScore: number | null;
  momentumScore: number | null;
}

type Row = {
  label: string;
  key: keyof CompareEntry;
  format: (v: number | null) => string;
  higherIsBetter: boolean;
};

const ROWS: Row[] = [
  { label: "Precio", key: "price", format: formatCurrency, higherIsBetter: true },
  { label: "Var. día", key: "changePct", format: (v) => formatPercent(v === null ? null : v / 100), higherIsBetter: true },
  { label: "Market cap", key: "marketCap", format: formatCompact, higherIsBetter: true },
  { label: "P/E", key: "pe", format: (v) => (v !== null ? v.toFixed(1) : "—"), higherIsBetter: false },
  { label: "P/S", key: "ps", format: (v) => (v !== null ? v.toFixed(1) : "—"), higherIsBetter: false },
  { label: "P/B", key: "pb", format: (v) => (v !== null ? v.toFixed(1) : "—"), higherIsBetter: false },
  { label: "EV/EBITDA", key: "evEbitda", format: (v) => (v !== null ? v.toFixed(1) : "—"), higherIsBetter: false },
  { label: "Dividend yield", key: "dividendYield", format: formatPercent, higherIsBetter: true },
  { label: "ROE", key: "roe", format: formatPercent, higherIsBetter: true },
  { label: "Margen bruto", key: "grossMargin", format: formatPercent, higherIsBetter: true },
  { label: "Margen operativo", key: "operatingMargin", format: formatPercent, higherIsBetter: true },
  { label: "Crecimiento ingresos", key: "revenueGrowth", format: formatPercent, higherIsBetter: true },
  { label: "Crecimiento EPS", key: "epsGrowth", format: formatPercent, higherIsBetter: true },
  { label: "Fair Value (consenso)", key: "fairValueConsensus", format: formatCurrency, higherIsBetter: true },
  { label: "Upside vs. precio", key: "upsidePct", format: formatPercent, higherIsBetter: true },
  { label: "Investment Score", key: "investmentScore", format: (v) => (v !== null ? v.toFixed(0) : "—"), higherIsBetter: true },
  { label: "Value Score", key: "valueScore", format: (v) => (v !== null ? v.toFixed(0) : "—"), higherIsBetter: true },
  { label: "Quality Score", key: "qualityScore", format: (v) => (v !== null ? v.toFixed(0) : "—"), higherIsBetter: true },
  { label: "Growth Score", key: "growthScore", format: (v) => (v !== null ? v.toFixed(0) : "—"), higherIsBetter: true },
  { label: "Momentum Score", key: "momentumScore", format: (v) => (v !== null ? v.toFixed(0) : "—"), higherIsBetter: true },
];

function winnerIndex(entries: CompareEntry[], row: Row): number | null {
  const values = entries.map((e) => e[row.key] as number | null);
  const known = values.filter((v): v is number => v !== null);
  if (known.length < 2) return null;
  const best = row.higherIsBetter ? Math.max(...known) : Math.min(...known);
  const idx = values.indexOf(best);
  return idx === -1 ? null : idx;
}

function CompareInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("symbols") ?? "";
  const [input, setInput] = useState(initial);
  const [entries, setEntries] = useState<CompareEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const currentSegment = input.split(",").pop()?.trim() ?? "";
  const { results: suggestions } = useTickerSearch(suggestOpen ? currentSegment : "");

  function selectSuggestion(symbol: string) {
    const parts = input.split(",");
    parts[parts.length - 1] = ` ${symbol}`;
    setInput(parts.join(",").replace(/^\s+/, "") + ", ");
    setSuggestOpen(false);
  }

  const symbolsParam = searchParams.get("symbols");

  useEffect(() => {
    if (!symbolsParam) {
      setEntries(null);
      return;
    }
    setLoading(true);
    fetch(`/api/compare?symbols=${encodeURIComponent(symbolsParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEntries(data?.results ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [symbolsParam]);

  function submit() {
    const cleaned = input
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 5)
      .join(",");
    if (cleaned) router.push(`/compare?symbols=${cleaned}`);
  }

  const valid = entries?.filter((e) => !e.error) ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Comparar"
        icon={GitCompareArrows}
        description="Compara hasta 5 activos por valoración, crecimiento, calidad, rentabilidad, dividendos y Fair Value."
      />

      <Card>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSuggestOpen(true);
              }}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setSuggestOpen(false)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ej. AAPL,MSFT,GOOGL"
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-fg"
            />
            {suggestOpen && (
              <TickerSuggestions results={suggestions} onSelect={(m) => selectSuggestion(m.symbol)} />
            )}
          </div>
          <button
            onClick={submit}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Comparar
          </button>
        </div>
      </Card>

      {loading ? (
        <Card padded={false}>
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </Card>
      ) : !entries ? (
        <EmptyState icon={GitCompareArrows} message="Ingresa entre 2 y 5 tickers separados por coma." />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <Thead>
                <Th>Métrica</Th>
                {entries.map((e) => (
                  <Th key={e.symbol}>
                    <div className="font-medium text-app-fg">{e.symbol}</div>
                    {e.error ? (
                      <div className="text-app-fg-faint">Dato no disponible</div>
                    ) : (
                      <div className="text-app-fg-muted">{e.companyName ?? ""}</div>
                    )}
                  </Th>
                ))}
              </Thead>
              <Tbody>
                {entries.length === 0 ? (
                  <TableEmpty colSpan={1}>Dato no disponible</TableEmpty>
                ) : (
                  ROWS.map((row) => {
                    const winner = valid.length >= 2 ? winnerIndex(entries, row) : null;
                    return (
                      <Tr key={row.key}>
                        <Td className="text-app-fg-muted">{row.label}</Td>
                        {entries.map((e, idx) => {
                          const value = e[row.key] as number | null;
                          const isWinner = winner !== null && winner === idx && !e.error;
                          return (
                            <Td key={e.symbol} className={isWinner ? "font-semibold text-positive" : "text-app-fg"}>
                              {e.error ? "—" : row.format(value)}
                            </Td>
                          );
                        })}
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <CompareInner />
    </Suspense>
  );
}
