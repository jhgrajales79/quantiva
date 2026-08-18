export function formatCurrency(value: number | null, currency = "USD"): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(
    value,
  );
}

export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return value.toFixed(digits);
}

export function formatCompact(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "Dato no disponible";
  const date = new Date(iso);
  return `${date.toLocaleDateString("es-CO")} ${date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
