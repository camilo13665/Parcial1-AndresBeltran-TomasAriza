/**
 * Utilidades compartidas por los microservicios.
 */

/** Genera un identificador único simple (placeholder hasta definir la estrategia final, p. ej. UUID v4 o ULID). */
export function generateId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Devuelve la fecha/hora actual en formato ISO 8601. */
export function nowIso(): string {
  return new Date().toISOString();
}
