export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto de estado") {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

/** Error al comunicarse con otro microservicio (caído, timeout, respuesta inesperada). */
export class UpstreamServiceError extends AppError {
  constructor(message = "Servicio dependiente no disponible") {
    super(message, 502, "UPSTREAM_SERVICE_ERROR");
    this.name = "UpstreamServiceError";
  }
}
