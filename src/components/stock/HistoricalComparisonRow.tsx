import { formatPercent } from "@/lib/format";

export interface ComparisonData {
  current: number | null;
  average: number | null;
  sampleCount: number;
  vsAveragePct: number | null;
  unavailable: boolean;
  reason: string | null;
}

export function HistoricalComparisonRow({
  label,
  data,
  formatValue,
  higherIsBetter = false,
}: {
  label: string;
  data: ComparisonData | undefined;
  formatValue: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  if (!data || data.unavailable || data.current === null) {
    return (
      <div className="flex items-center justify-between py-2 text-sm">
        <span className="text-app-fg-muted">{label}</span>
        <span className="text-xs text-app-fg-muted">{data?.reason ?? "Dato no disponible"}</span>
      </div>
    );
  }

  const isGood =
    data.vsAveragePct === null ? null : higherIsBetter ? data.vsAveragePct >= 0 : data.vsAveragePct <= 0;

  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-app-fg-muted">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-medium text-app-fg">{formatValue(data.current)}</span>
        {data.average !== null ? (
          <span
            className={
              isGood === null ? "text-xs text-app-fg-muted" : isGood ? "text-xs text-emerald-400" : "text-xs text-red-400"
            }
          >
            vs. promedio propio {formatValue(data.average)} ({formatPercent(data.vsAveragePct)}, {data.sampleCount} muestras)
          </span>
        ) : (
          <span className="text-xs text-app-fg-muted">Historial insuficiente</span>
        )}
      </div>
    </div>
  );
}
