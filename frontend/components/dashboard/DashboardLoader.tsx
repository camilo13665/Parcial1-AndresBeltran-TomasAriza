"use client";

import { useCallback, useEffect, useState } from "react";
import { Emergency, EmergencyResource } from "@/types";
import { emergenciesApi, resourcesApi, ApiError } from "@/services/api/client";
import { MOCK_EMERGENCIES, MOCK_RESOURCES } from "@/lib/mock-data";
import { DashboardView } from "@/components/dashboard/DashboardView";

type LoadState = "loading" | "live" | "offline";

export function DashboardLoader() {
  const [state, setState] = useState<LoadState>("loading");
  const [emergencies, setEmergencies] = useState<Emergency[]>(MOCK_EMERGENCIES);
  const [resources, setResources] = useState<EmergencyResource[]>(MOCK_RESOURCES);
  // Se incrementa cada vez que una acción de operador (cambiar estado,
  // asignar recurso) necesita forzar un refresco de todos los paneles.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [emergenciesRes, resourcesRes] = await Promise.all([emergenciesApi.list(), resourcesApi.list()]);
        if (cancelled) return;
        setEmergencies(emergenciesRes.data as unknown as Emergency[]);
        setResources(resourcesRes.data as unknown as EmergencyResource[]);
        setState("live");
      } catch {
        if (!cancelled) setState("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleChanged = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {state === "offline" && (
        <div
          className="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
          style={{ borderColor: "var(--border-strong)", background: "var(--surface-raised)", color: "var(--text-secondary)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--danger)" }} />
          No se pudo conectar con Intake &amp; Triage / Dispatch — mostrando datos de ejemplo.
        </div>
      )}
      {state === "loading" && (
        <div className="text-sm text-text-muted data-mono">Cargando datos del backend…</div>
      )}
      <DashboardView emergencies={emergencies} resources={resources} onChanged={handleChanged} reloadKey={reloadKey} />
    </div>
  );
}
