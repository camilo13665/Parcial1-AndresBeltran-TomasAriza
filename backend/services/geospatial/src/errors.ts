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

/** Error al comunicarse con otro microservicio (caído, timeout, respuesta inesperada). */
export class UpstreamServiceError extends AppError {
  constructor(message = "Servicio dependiente no disponible") {
    super(message, 502, "UPSTREAM_SERVICE_ERROR");
    this.name = "UpstreamServiceError";
  }
}
