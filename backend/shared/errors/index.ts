/**
 * Errores base compartidos por los microservicios.
 *
 * Por ahora solo se define la estructura; el manejo centralizado de errores
 * (handlers de Fastify, mapeo a códigos HTTP, logging) se implementará
 * cuando se agregue la lógica de negocio real.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos inválidos") {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
