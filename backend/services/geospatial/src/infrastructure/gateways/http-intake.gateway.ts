import { UpstreamServiceError } from "../../domain/errors";
import { EmergencyFeedPort, RemoteEmergency } from "../../domain/ports/emergency-feed.port";

const INTAKE_SERVICE_URL = process.env.INTAKE_SERVICE_URL ?? "http://localhost:3001";
const TIMEOUT_MS = 3000;

/** Adapter HTTP hacia Intake & Triage — implementa EmergencyFeedPort. */
export class HttpIntakeGateway implements EmergencyFeedPort {
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
  }
}
