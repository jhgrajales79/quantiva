"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";
import { assignLabelRows } from "@/lib/label-layout";
import { Spinner } from "@/components/ui/Spinner";

type Period = "1d" | "1w" | "1m" | "ytd";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "1d", label: "Hoy" },
  { key: "1w", label: "1 sem." },
  { key: "1m", label: "1 mes" },
  { key: "ytd", label: "YTD" },
];

interface SectorResult {
  symbol: string;
  label: string;
  returns: Record<Period, number | null>;
  error: string | null;
}

export function SectorRotationWidget() {
  const [sectors, setSectors] = useState<SectorResult[] | null>(null);
  const [period, setPeriod] = useState<Period>("ytd");

  useEffect(() => {
    fetch("/api/sectors")
      .then((res) => res.json())
      .then((data) => setSectors(data.sectors))
      .catch(() => setSectors([]));
  }, []);

  return (
    <Card>
      <CardHeader
        title="Rotación sectorial · 11 sectores del S&P 500"
        action={
          <div className="flex gap-1">
            {PERIOD_TABS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  period === p.key
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:text-app-fg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <p className="mb-4 text-xs text-app-fg-muted">
        Dónde entra y sale el dinero. Cada punto es un sector.
      </p>

      {!sectors ? (
        <Spinner />
      ) : (
        <SectorAxis sectors={sectors} period={period} />
      )}

      <div className="mt-2 flex justify-between text-xs text-app-fg-muted">
        <span>← Más débil</span>
        <span>Más fuerte →</span>
      </div>
    </Card>
  );
}

// Desplazamiento vertical (en px) de cada fila respecto al punto — con
// suficiente separación entre filas consecutivas (más que la altura real de
// una etiqueta de 2 líneas, ~33px) para que dos etiquetas en filas
// distintas nunca se superpongan verticalmente, sin importar qué tan cerca
// estén horizontalmente. Antes usaba clases de Tailwind ("-top-14"...) con
// solo 20px de separación entre algunas filas — menos que la altura real de
// una etiqueta — lo que las hacía chocar igual aunque el algoritmo de
// colisión horizontal las hubiera puesto en filas "distintas".
const ROW_OFFSETS_PX = [-80, -40, 6, 46];
const LABEL_FONT = "500 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
// Espacio entre el borde de una etiqueta y la de su vecina, además de la
// mitad de cada ancho — evita que queden pegadas incluso cuando el gap
// calculado es justo.
const LABEL_BUFFER_PX = 10;

let measureCtx: CanvasRenderingContext2D | null = null;

// Ancho real del texto renderizado (no una aproximación por cantidad de
// caracteres) — así "Servicios públicos" y "Salud" reciben el espacio que
// cada uno de verdad necesita en vez de tratarse como del mismo tamaño.
function measureTextWidth(text: string): number {
  if (typeof document === "undefined") return text.length * 6.2;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return text.length * 6.2;
  measureCtx.font = LABEL_FONT;
  return measureCtx.measureText(text).width;
}

function SectorAxis({ sectors, period }: { sectors: SectorResult[]; period: Period }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    setContainerWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    observer.observe(node);
  }, []);

  const withValues = sectors
    .map((s) => ({ ...s, value: s.returns[period] }))
    .filter((s): s is SectorResult & { value: number } => s.value !== null)
    .sort((a, b) => a.value - b.value);

  if (withValues.length === 0) {
    return <p className="text-sm text-app-fg-muted">Dato no disponible.</p>;
  }

  const min = Math.min(...withValues.map((s) => s.value));
  const max = Math.max(...withValues.map((s) => s.value));
  const span = max - min || 1;

  const leftPcts = withValues.map((s) => ((s.value - min) / span) * 100);

  // Ancho estimado de cada etiqueta = la línea más ancha entre el nombre del
  // sector y su porcentaje, medido con canvas (texto real, no una
  // aproximación) — así las colisiones se calculan en píxeles reales del
  // contenedor actual, sin importar qué tan angosto lo haya dejado el
  // usuario al redimensionar el widget.
  const labelWidths = withValues.map((s) =>
    Math.max(measureTextWidth(s.label), measureTextWidth(formatPercent(s.value))) +
    LABEL_BUFFER_PX,
  );

  const hasWidth = containerWidth > 0;
  const centersPx = withValues.map((_, i) => {
    if (!hasWidth) return 0;
    const half = labelWidths[i] / 2;
    const ideal = (leftPcts[i] / 100) * containerWidth;
    // La etiqueta se centra en su punto, pero si eso la haría salirse del
    // contenedor (típico en los extremos, el sector más débil/más fuerte),
    // se desliza hacia adentro lo justo para que el texto quede completo.
    return Math.min(containerWidth - half, Math.max(half, ideal));
  });
  const halfWidthsPx = labelWidths.map((w) => w / 2);
  const rowIndexes = hasWidth
    ? assignLabelRows(centersPx, ROW_OFFSETS_PX.length, halfWidthsPx)
    : withValues.map((_, i) => i % ROW_OFFSETS_PX.length);

  return (
    <div
      ref={containerRef}
      className="relative mt-24 mb-24 h-1.5 w-full rounded-full bg-gradient-to-r from-negative via-warning to-positive"
    >
      {withValues.map((s, i) => (
        <div
          key={s.symbol}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${leftPcts[i]}%` }}
        >
          <div className="h-2.5 w-2.5 rounded-pill border-2 border-app-border bg-app-fg" />
        </div>
      ))}
      {hasWidth &&
        withValues.map((s, i) => (
          <div
            key={`label-${s.symbol}`}
            className="absolute w-max -translate-x-1/2 text-center"
            style={{ left: `${centersPx[i]}px`, top: `${ROW_OFFSETS_PX[rowIndexes[i]]}px` }}
          >
            <p className="text-[11px] font-medium text-app-fg-muted">{s.label}</p>
            <p className={s.value >= 0 ? "text-[11px] text-positive" : "text-[11px] text-negative"}>
              {formatPercent(s.value)}
            </p>
          </div>
        ))}
    </div>
  );
}
