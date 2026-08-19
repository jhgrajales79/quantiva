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

function toSeries(data: PricePoint[]): { time: string; value: number }[] {
  return data.map((p) => ({ time: p.date, value: p.close }));
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
      rightPriceScale: { borderColor: border },
      leftPriceScale: { visible: false },
    });
    chartRef.current = chart;

    if (showComparison && compareWith) {
      const stockSeries = chart.addSeries(LineSeries, {
        color: "#34d399",
        lineWidth: 2,
        title: "Acción",
        priceScaleId: "right",
        priceFormat: { type: "custom", formatter: (v: number) => `$${v.toFixed(2)}` },
      });
      stockSeries.setData(toSeries(data));

      const compareSeries = chart.addSeries(LineSeries, {
        color: compareWith.color,
        lineWidth: 2,
        title: compareWith.label,
        priceScaleId: "right",
        priceFormat: { type: "custom", formatter: (v: number) => `$${v.toFixed(2)}` },
      });
      compareSeries.setData(toSeries(compareWith.data));
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
            Acción
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: compareWith.color }} />
            {compareWith.label}
          </span>
        </div>
      )}
      <div ref={containerRef} className="rounded-lg border border-app-border bg-app-surface p-2" />
    </div>
  );
}
