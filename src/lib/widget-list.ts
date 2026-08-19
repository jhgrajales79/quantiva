export function sanitizeWidgetList(input: unknown, allIds: string[], defaultIds: string[]): string[] {
  if (!Array.isArray(input)) return defaultIds;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of input) {
    if (typeof item === "string" && allIds.includes(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export type WidgetSize = "half" | "full";

// Tamaño elegido por el usuario para cada widget — no es el span fijo del
// registro (definido por el desarrollador), sino la preferencia guardada
// para que el usuario pueda ampliar/reducir cada widget a su gusto.
export function sanitizeWidgetSizes(input: unknown, allIds: string[]): Record<string, WidgetSize> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const result: Record<string, WidgetSize> = {};
  for (const [id, size] of Object.entries(input as Record<string, unknown>)) {
    if (allIds.includes(id) && (size === "half" || size === "full")) {
      result[id] = size;
    }
  }
  return result;
}
