import { UpstreamServiceError } from "../errors";

/**
 * Cliente HTTP hacia Intake & Triage.
 *
 * Geospatial no tiene su propio store de emergencias ni accede a la base
 * de datos de Intake & Triage — para generar estadísticas por zona,
 * consulta la lista vigente de emergencias a través de su API pública.
 */
const INTAKE_SERVICE_URL = process.env.INTAKE_SERVICE_URL ?? "http://localhost:3001";
const TIMEOUT_MS = 3000;

export interface RemoteEmergency {
  id: string;
  ciudad: string;
  prioridad: string;
  latitud: number;
  longitud: number;
}

export const intakeClient = {
  async listEmergencies(): Promise<RemoteEmergency[]> {
    let response: Response;
    try {
      response = await fetch(`${INTAKE_SERVICE_URL}/emergencies`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new UpstreamServiceError(`No se pudo conectar con Intake & Triage (${INTAKE_SERVICE_URL}): ${reason}`);
    }

    if (!response.ok) {
      throw new UpstreamServiceError(`Intake & Triage respondió con estado ${response.status}`);
    }

    const body = (await response.json()) as { data: RemoteEmergency[] };
    return body.data;
  },
};
