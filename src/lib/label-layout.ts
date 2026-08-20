/**
 * Asigna cada posición (ya ordenadas ascendente) a una de `rowCount` filas,
 * evitando que dos etiquetas en la misma fila queden más cerca que el gap
 * mínimo requerido. Greedy left-to-right: prueba las filas en round-robin y
 * usa la primera que respeta el espacio mínimo; si ninguna lo respeta
 * (puntos muy amontonados), usa la fila menos usada recientemente en vez de
 * forzar siempre la misma. Devuelve el índice de fila para cada posición,
 * en el mismo orden de entrada.
 *
 * `minGap` puede ser un número fijo (mismo gap para todo el mundo) o un
 * arreglo con el "medio ancho" de cada etiqueta (en las mismas unidades que
 * `positions`, normalmente píxeles) — en ese caso el gap requerido entre dos
 * etiquetas es la suma de sus medios anchos, así una etiqueta larga ("Servicios
 * públicos") no queda pegada a su vecina aunque una etiqueta corta ("Salud")
 * en esa misma posición sí hubiera cabido.
 */
export function assignLabelRows(
  positions: number[],
  rowCount: number,
  minGap: number | number[],
): number[] {
  const lastPositionByRow = new Array(rowCount).fill(-Infinity);
  const lastHalfWidthByRow = new Array(rowCount).fill(0);
  const rows: number[] = [];
  const halfWidthAt = (i: number) => (typeof minGap === "number" ? minGap / 2 : minGap[i]);

  positions.forEach((pos, i) => {
    const preferredOrder = Array.from({ length: rowCount }, (_, r) => (i + r) % rowCount);
    const fitting = preferredOrder.find((row) => {
      const required =
        typeof minGap === "number" ? minGap : halfWidthAt(i) + lastHalfWidthByRow[row];
      return pos - lastPositionByRow[row] >= required;
    });

    const chosenRow =
      fitting !== undefined
        ? fitting
        : lastPositionByRow.indexOf(Math.min(...lastPositionByRow));

    lastPositionByRow[chosenRow] = pos;
    lastHalfWidthByRow[chosenRow] = halfWidthAt(i);
    rows.push(chosenRow);
  });

  return rows;
}
