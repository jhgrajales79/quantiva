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

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
}

// 24 en vez de 12 para permitir posiciones/anchos más finos al arrastrar
// (no solo mitad/completo) y que cada widget pueda usar el ancho que
// el usuario quiera, no solo dos posiciones fijas.
export const GRID_COLS = 24;

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// Posiciones/tamaños de cuadrícula elegidos por el usuario (arrastrar y
// soltar) — no son fijos, se guardan por usuario y por widget.
export function sanitizeWidgetLayout(input: unknown, allIds: string[]): GridLayoutItem[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const result: GridLayoutItem[] = [];
  for (const item of input) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { i?: unknown }).i === "string" &&
      allIds.includes((item as { i: string }).i) &&
      !seen.has((item as { i: string }).i) &&
      isFiniteNonNegative((item as { x?: unknown }).x) &&
      isFiniteNonNegative((item as { y?: unknown }).y) &&
      typeof (item as { w?: unknown }).w === "number" &&
      typeof (item as { h?: unknown }).h === "number" &&
      (item as { w: number }).w > 0 &&
      (item as { h: number }).h > 0
    ) {
      const it = item as GridLayoutItem;
      seen.add(it.i);
      const w = Math.min(it.w, GRID_COLS);
      result.push({ i: it.i, x: Math.min(it.x, GRID_COLS - w), y: it.y, w, h: it.h });
    }
  }
  return result;
}

// Genera una disposición inicial en dos columnas (o una fila completa para
// los widgets de ancho completo) cuando el usuario todavía no personalizó
// nada — solo un punto de partida razonable, no un tamaño fijo.
export function generateDefaultLayout(
  defs: { id: string; span: "half" | "full"; defaultH: number; minW?: number }[],
  ids: string[],
): GridLayoutItem[] {
  const half = GRID_COLS / 2;
  let leftY = 0;
  let rightY = 0;
  const items: GridLayoutItem[] = [];
  for (const id of ids) {
    const def = defs.find((d) => d.id === id);
    if (!def) continue;
    const h = def.defaultH;
    if (def.span === "full") {
      const y = Math.max(leftY, rightY);
      items.push({ i: id, x: 0, y, w: GRID_COLS, h, minW: def.minW });
      leftY = y + h;
      rightY = y + h;
    } else if (leftY <= rightY) {
      items.push({ i: id, x: 0, y: leftY, w: half, h, minW: def.minW });
      leftY += h;
    } else {
      items.push({ i: id, x: half, y: rightY, w: half, h, minW: def.minW });
      rightY += h;
    }
  }
  return items;
}
