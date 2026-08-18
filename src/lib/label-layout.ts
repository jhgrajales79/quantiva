/**
 * Asigna cada posición (0-100, ya ordenadas ascendente) a una de `rowCount`
 * filas, evitando que dos etiquetas en la misma fila queden más cerca que
 * `minGapPct`. Greedy left-to-right: prueba las filas en round-robin y usa
 * la primera que respeta el espacio mínimo; si ninguna lo respeta (puntos
 * muy amontonados), usa la fila menos usada recientemente en vez de forzar
 * siempre la misma. Devuelve el índice de fila para cada posición, en el
 * mismo orden de entrada.
 */
export function assignLabelRows(
  positions: number[],
  rowCount: number,
  minGapPct: number,
): number[] {
  const lastPositionByRow = new Array(rowCount).fill(-Infinity);
  const rows: number[] = [];

  positions.forEach((pos, i) => {
    const preferredOrder = Array.from({ length: rowCount }, (_, r) => (i + r) % rowCount);
    const fitting = preferredOrder.find((row) => pos - lastPositionByRow[row] >= minGapPct);

    const chosenRow =
      fitting !== undefined
        ? fitting
        : lastPositionByRow.indexOf(Math.min(...lastPositionByRow));

    lastPositionByRow[chosenRow] = pos;
    rows.push(chosenRow);
  });

  return rows;
}
