import clsx from "clsx";
import { Card } from "@/components/ui/Card";

export function ScorePill({ label, value }: { label: string; value: number | null }) {
  const color =
    value === null
      ? "text-app-fg-muted"
      : value >= 75
        ? "text-positive"
        : value >= 50
          ? "text-warning"
          : "text-negative";

  return (
    <Card className="text-center">
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className={clsx("text-xl font-semibold tabular-nums", color)}>
        {value === null ? "—" : value.toFixed(0)}
      </p>
    </Card>
  );
}
