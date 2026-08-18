"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

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
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
