"use client";

import { useEffect, useRef, useState } from "react";
import { apiClient, ServiceName } from "@/services/api/client";

export type HealthState = "checking" | "online" | "offline";

const SERVICES: ServiceName[] = ["intake", "dispatch", "geospatial", "notification"];

export interface ServiceHealthMap {
  intake: HealthState;
  dispatch: HealthState;
  geospatial: HealthState;
  notification: HealthState;
}

const INITIAL_STATE: ServiceHealthMap = {
  intake: "checking",
  dispatch: "checking",
  geospatial: "checking",
  notification: "checking",
};

/**
 * Sondea /health de los cuatro microservicios cada `intervalMs`.
 * Refleja en vivo si cada servicio está arriba — pensado para confirmar,
 * como pide el criterio de finalización, que los cuatro están corriendo
 * de forma independiente.
 */
export function useServiceHealth(intervalMs = 8000) {
  const [state, setState] = useState<ServiceHealthMap>(INITIAL_STATE);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function checkAll() {
      const results = await Promise.all(
        SERVICES.map(async (service) => {
          try {
            await apiClient.health(service);
            return [service, "online" as HealthState] as const;
          } catch {
            return [service, "offline" as HealthState] as const;
          }
        }),
      );

      if (!mounted.current) return;
      setState((prev) => ({ ...prev, ...Object.fromEntries(results) }));
    }

    checkAll();
    const id = setInterval(checkAll, intervalMs);

    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return state;
}
