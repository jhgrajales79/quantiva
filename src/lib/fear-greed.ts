const RATING_LABELS_ES: Record<string, string> = {
  "extreme fear": "Miedo extremo",
  fear: "Miedo",
  neutral: "Neutral",
  greed: "Codicia",
  "extreme greed": "Codicia extrema",
};

/**
 * Traduce el `rating` textual que ya viene calculado por CNN (no
 * recalculamos el bucket nosotros, para no discrepar de la fuente).
 * Si CNN devuelve un valor no reconocido, se muestra tal cual en vez de
 * inventar una traducción.
 */
export function translateFearGreedRating(rating: string): string {
  return RATING_LABELS_ES[rating.toLowerCase()] ?? rating;
}
