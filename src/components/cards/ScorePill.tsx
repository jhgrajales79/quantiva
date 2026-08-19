export function ScorePill({ label, value }: { label: string; value: number | null }) {
  const color =
    value === null
      ? "text-app-fg-muted"
      : value >= 75
        ? "text-emerald-400"
        : value >= 50
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="rounded-lg border border-app-border bg-app-surface p-3 text-center">
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>
        {value === null ? "—" : value.toFixed(0)}
      </p>
    </div>
  );
}
