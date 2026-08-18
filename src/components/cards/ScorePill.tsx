export function ScorePill({ label, value }: { label: string; value: number | null }) {
  const color =
    value === null
      ? "text-neutral-500"
      : value >= 75
        ? "text-emerald-400"
        : value >= 50
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-center">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>
        {value === null ? "—" : value.toFixed(0)}
      </p>
    </div>
  );
}
