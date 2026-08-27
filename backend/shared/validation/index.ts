/**
 * Módulo de validación compartido.
 *
 * En esta fase no se implementa validación de negocio (por ejemplo, con
 * Zod o JSON Schema). Se deja preparado el punto de extensión para que cada
 * microservicio defina sus propios `schemas/` (ver `src/schemas/` en cada
 * servicio) y reutilice helpers comunes desde aquí en fases posteriores.
 */

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[] };
