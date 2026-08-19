"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi } from "lightweight-charts";

interface PricePoint {
  date: string;
  close: number;
}

interface ComparisonSeries {
  label: string;
  color: string;
  data: PricePoint[];
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function toIndexed(data: PricePoint[]): { time: string; value: number }[] {
  if (data.length === 0) return [];
  const base = data[0].close;
  if (!base) return [];
  return data.map((p) => ({ time: p.date, value: ((p.close - base) / base) * 100 }));
}

export function PriceChart({
  data,
  compareWith,
}: {
  data: PricePoint[];
  compareWith?: ComparisonSeries;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const bg = cssVar("--color-app-surface", "#171717");
    const fg = cssVar("--color-app-fg-muted", "#a3a3a3");
    const border = cssVar("--color-app-border", "#262626");
    const primaryColor = cssVar("--color-emerald-400", "#34d399");

    const showComparison = Boolean(compareWith && compareWith.data.length > 0);

    const chart = createChart(containerRef.current, {
      layout: { background: { color: bg }, textColor: fg },
      grid: {
        vertLines: { color: border },
        horzLines: { color: border },
      },
      width: containerRef.current.clientWidth,
      height: 320,
      timeScale: { borderColor: border },
      rightPriceScale: {
        borderColor: border,
        ...(showComparison ? { mode: 0 } : {}),
      },
    });
    chartRef.current = chart;

    if (showComparison && compareWith) {
      const stockSeries = chart.addSeries(LineSeries, {
        color: "#34d399",
        lineWidth: 2,
        title: "Acción",
        priceFormat: { type: "custom", formatter: (v: number) => `${v.toFixed(1)}%` },
      });
      stockSeries.setData(toIndexed(data));

      const compareSeries = chart.addSeries(LineSeries, {
        color: compareWith.color,
        lineWidth: 2,
        title: compareWith.label,
        priceFormat: { type: "custom", formatter: (v: number) => `${v.toFixed(1)}%` },
      });
      compareSeries.setData(toIndexed(compareWith.data));
    } else {
      const series = chart.addSeries(LineSeries, {
        color: primaryColor,
        lineWidth: 2,
      });
      series.setData(data.map((p) => ({ time: p.date, value: p.close })));
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, compareWith]);

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-app-border bg-app-surface text-sm text-app-fg-muted">
        Dato no disponible: sin histórico de precios todavía.
      </div>
    );
  }

  return (
    <div>
      {compareWith && compareWith.data.length > 0 && (
        <div className="mb-1.5 flex items-center gap-4 text-xs text-app-fg-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-emerald-400" />
            Acción (% vs. inicio del período)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: compareWith.color }} />
            {compareWith.label} (% vs. inicio del período)
          </span>
        </div>
      )}
      <div ref={containerRef} className="rounded-lg border border-app-border bg-app-surface p-2" />
    </div>
  );
}
