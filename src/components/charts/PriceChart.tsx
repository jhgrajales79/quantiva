"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, type IChartApi } from "lightweight-charts";

interface PricePoint {
  date: string;
  close: number;
}

export function PriceChart({ data }: { data: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#0a0a0a" }, textColor: "#a3a3a3" },
      grid: {
        vertLines: { color: "#1f1f1f" },
        horzLines: { color: "#1f1f1f" },
      },
      width: containerRef.current.clientWidth,
      height: 320,
      timeScale: { borderColor: "#262626" },
      rightPriceScale: { borderColor: "#262626" },
    });
    chartRef.current = chart;

    const series = chart.addSeries(LineSeries, {
      color: "#34d399",
      lineWidth: 2,
    });
    series.setData(data.map((p) => ({ time: p.date, value: p.close })));
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
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-app-border bg-app-surface text-sm text-app-fg-muted">
        Dato no disponible: sin histórico de precios todavía.
      </div>
    );
  }

  return <div ref={containerRef} className="rounded-lg border border-app-border bg-app-surface p-2" />;
}
