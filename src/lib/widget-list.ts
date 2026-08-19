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
