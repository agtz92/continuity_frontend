/**
 * Ordenamiento de tablas EN MEMORIA, sobre las filas ya traídas.
 *
 * Pensado para las tablas del admin, que paginan contra Supabase y filtran en
 * memoria sobre la página actual (ver `adminUsers` en el backend). Ordenar aquí
 * mantiene esa misma semántica: el orden aplica a la página que se está viendo,
 * no a todo el universo de usuarios.
 *
 * Reglas:
 * - Los valores vacíos (null/undefined/"") van SIEMPRE al final, suban o bajen
 *   los demás: una fila sin fecha no es "la más antigua", es una fila sin dato.
 * - Las cadenas se comparan con `localeCompare` numérico e insensible a
 *   acentos/mayúsculas, para que "Ángel" y "angel" queden juntos y "item10"
 *   vaya después de "item9".
 * - `sortRows` no muta el arreglo original y el `sort` de JS es estable, así
 *   que las filas empatadas conservan el orden que trajo el servidor.
 */

export type SortDir = "asc" | "desc";

export type SortState<K extends string = string> = {
  key: K;
  dir: SortDir;
} | null;

export type SortValue = string | number | boolean | null | undefined;

/** ¿El valor es "sin dato"? Esas filas se van al final en ambas direcciones. */
export function isEmptySortValue(value: SortValue): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * Compara dos valores no vacíos en orden ascendente.
 *
 * Los booleanos cuentan como 0/1 (false antes que true), así que en descendente
 * las casillas marcadas quedan arriba.
 */
export function compareSortValues(a: SortValue, b: SortValue): number {
  if (isEmptySortValue(a) || isEmptySortValue(b)) {
    if (isEmptySortValue(a) && isEmptySortValue(b)) return 0;
    return isEmptySortValue(a) ? 1 : -1;
  }
  if (typeof a === "string" || typeof b === "string") {
    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  const an = Number(a);
  const bn = Number(b);
  if (Number.isNaN(an) || Number.isNaN(bn)) return 0;
  return an - bn;
}

/**
 * Devuelve una copia de `rows` ordenada según `state`.
 *
 * @param rows Filas de la página actual.
 * @param state Columna y dirección activas, o `null` para dejar el orden del servidor.
 * @param getValue Extrae de una fila el valor comparable de esa columna.
 */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  state: SortState<K>,
  getValue: (row: T, key: K) => SortValue
): T[] {
  if (!state) return [...rows];
  const factor = state.dir === "asc" ? 1 : -1;
  return [...rows].sort((rowA, rowB) => {
    const a = getValue(rowA, state.key);
    const b = getValue(rowB, state.key);
    const aEmpty = isEmptySortValue(a);
    const bEmpty = isEmptySortValue(b);
    if (aEmpty || bEmpty) {
      if (aEmpty && bEmpty) return 0;
      return aEmpty ? 1 : -1;
    }
    return compareSortValues(a, b) * factor;
  });
}

/**
 * Siguiente estado al hacer clic en el encabezado de `key`.
 *
 * Ciclo de tres pasos: dirección por defecto → la contraria → sin orden (vuelve
 * al orden del servidor). Clicar otra columna empieza su propio ciclo.
 */
export function nextSortState<K extends string>(
  current: SortState<K>,
  key: K,
  defaultDir: SortDir = "asc"
): SortState<K> {
  if (!current || current.key !== key) return { key, dir: defaultDir };
  if (current.dir === defaultDir) {
    return { key, dir: defaultDir === "asc" ? "desc" : "asc" };
  }
  return null;
}

/** Convierte un timestamp ISO en número comparable; `null` si no es fecha. */
export function toSortableTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}
