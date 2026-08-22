"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";

export function MiniSparkline({
  data,
  positive,
}: {
  data: { value: number | null }[];
  positive: boolean | null;
}) {
  const points = data.filter((d): d is { value: number } => d.value !== null);
  if (points.length < 2) return null;

  const color = positive === null ? "#a3a3a3" : positive ? "#34d399" : "#f87171";

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          {/* Recharts usa [0, "auto"] como dominio por defecto — con series
              cuyos valores están lejos de cero (nivel del CPI, PIB en miles
              de millones) eso aplasta toda la variación real contra la
              parte de arriba del gráfico, mostrando una línea casi recta.
              Forzar el dominio al rango real de los datos hace visible la
              tendencia de verdad. */}
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
