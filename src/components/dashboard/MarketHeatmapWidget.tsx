"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, Treemap } from "recharts";
import type { TreemapNode } from "recharts/types/chart/Treemap";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/format";
import { LayoutGrid } from "lucide-react";

type Category = "stocks" | "etf" | "crypto";

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: "stocks", label: "Acciones" },
  { key: "etf", label: "ETFs" },
  { key: "crypto", label: "Cripto" },
];

interface Tile {
  symbol: string;
  name: string;
  marketCap: number | null;
  changePct: number | null;
}

// El link de cada celda depende de la categoría: acciones y ETFs tienen
// ficha propia en la app, cripto todavía no.
function hrefFor(category: Category, symbol: string): string | null {
  if (category === "crypto") return null;
  if (category === "etf") return `/etfs/${symbol}`;
  return `/stocks/${symbol}`;
}

// Intensidad continua según la magnitud del cambio (no unos pocos tonos
// fijos) — el color base viene del token semántico (respeta el tema
// claro/oscuro), la opacidad es lo único que varía con `changePct`.
function tileStyle(changePct: number | null): React.CSSProperties {
  // Sin dato o cambio nulo real: gris neutro, no un tinte ambiguo de color.
  if (changePct === null || changePct === 0) {
    return { fill: "var(--color-app-surface-2)", stroke: "var(--color-app-border)" };
  }
  const magnitude = Math.min(1, Math.abs(changePct) / 4); // ±4% ya se ve al tope de intensidad
  // Curva (no lineal): raíz cuadrada empuja hacia arriba los cambios chicos
  // para que se vean vivos, no lavados, sin perder la diferenciación con
  // los cambios grandes (que igual llegan primero al tope).
  const intensity = Math.sqrt(magnitude);
  const opacity = 0.55 + intensity * 0.45;
  return {
    fill: changePct >= 0 ? "var(--color-positive)" : "var(--color-negative)",
    fillOpacity: opacity,
    stroke: "var(--color-app-border)",
  };
}

function HeatmapCell(props: TreemapNode & { category: Category; changeBySymbol: Map<string, number | null> }) {
  const { x, y, width, height, name, category, changeBySymbol } = props;
  if (width <= 0 || height <= 0) return null;

  // No confiar en que recharts propague campos extra del datum original al
  // nodo del Treemap (no lo hace de forma confiable en celdas anidadas) —
  // se busca el changePct real por símbolo en el mapa que sí controlamos.
  const changePct = changeBySymbol.get(name) ?? null;
  const href = hrefFor(category, name);
  const showLabel = width > 34 && height > 24;

  const content = (
    <g>
      <rect x={x} y={y} width={width} height={height} style={tileStyle(changePct)} strokeWidth={1} />
      {showLabel && (
        <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" className="pointer-events-none fill-app-fg text-[11px] font-semibold">
          {name}
        </text>
      )}
      {showLabel && (
        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" className="pointer-events-none fill-app-fg-muted text-[10px] tabular-nums">
          {changePct !== null ? formatPercent(changePct / 100) : "—"}
        </text>
      )}
    </g>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}

export function MarketHeatmapWidget() {
  const [category, setCategory] = useState<Category>("stocks");
  const [tiles, setTiles] = useState<Tile[] | null>(null);

  useEffect(() => {
    setTiles(null);
    fetch(`/api/heatmap?category=${category}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setTiles(data?.tiles ?? []))
      .catch(() => setTiles([]));
  }, [category]);

  const data = (tiles ?? [])
    .filter((t) => t.marketCap !== null && t.marketCap > 0)
    .map((t) => ({ name: t.symbol, size: t.marketCap as number }));

  const changeBySymbol = new Map((tiles ?? []).map((t) => [t.symbol, t.changePct]));

  return (
    <Card>
      <CardHeader
        title="Mapa de calor del mercado"
        action={
          <div className="flex gap-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-fast ${
                  category === tab.key
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:text-app-fg"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      />
      <p className="mb-3 text-xs text-app-fg-muted">
        Tamaño = capitalización de mercado · color = variación del período (verde sube, rojo baja).
      </p>
      {!tiles ? (
        <Skeleton className="h-96 w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={LayoutGrid} message="Dato no disponible para esta categoría." />
      ) : (
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              isAnimationActive={false}
              content={(props: TreemapNode) => (
                <HeatmapCell {...props} category={category} changeBySymbol={changeBySymbol} />
              )}
            />
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
