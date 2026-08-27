"use client";

import { useEffect, useState } from "react";
import { City, EmergencyStatus, ResourceStatus } from "@/types";
import { RESOURCE_TYPE_LABEL } from "@/lib/constants";
import { resourcesApi, dispatchesApi, ApiError, type DispatchRecord } from "@/services/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAdminSession } from "@/hooks/useAdminSession";

interface ResourceOption {
  id: string;
  tipo: string;
  organismo: string;
  ciudad: string;
  estado: string;
}

interface AssignResourcePanelProps {
  emergenciaId: string;
  ciudad: City;
  estado: EmergencyStatus;
  onAssigned: () => void;
}

/**
 * Permite a un operador asignar un recurso disponible a una emergencia.
 * La llamada real va a Dispatch (`POST /dispatches`), que valida la
 * emergencia contra Intake & Triage y, si todo procede, avanza su estado
 * a ASIGNADA — es decir, este componente es la puerta de entrada de UI a
 * todo el flujo de comunicación entre microservicios ya implementado.
 */
export function AssignResourcePanel({ emergenciaId, ciudad, estado, onAssigned }: AssignResourcePanelProps) {
  const isAdmin = useAdminSession();
  const [resources, setResources] = useState<ResourceOption[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DispatchRecord | null>(null);

  const eligible = estado === EmergencyStatus.PRIORIZADA;

  useEffect(() => {
    if (isAdmin !== true || !eligible) {
      setLoadingResources(false);
      return;
    }
    let cancelled = false;
    setLoadingResources(true);
    resourcesApi
      .list({ ciudad, estado: ResourceStatus.DISPONIBLE })
      .then((res) => {
        if (cancelled) return;
        setResources(res.data as unknown as ResourceOption[]);
        setSelected((res.data[0] as unknown as ResourceOption | undefined)?.id ?? "");
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la lista de recursos disponibles.");
      })
      .finally(() => {
        if (!cancelled) setLoadingResources(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ciudad, eligible, isAdmin]);

  async function handleAssign() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const dispatch = await dispatchesApi.create(emergenciaId, [selected], notas.trim() || undefined);
      setResult(dispatch);
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo asignar el recurso.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAdmin !== true) return null;

  if (!eligible) {
    return (
      <Card>
        <span className="eyebrow mb-1 block">Asignar recurso</span>
        <p className="text-sm text-text-secondary">
          {estado === EmergencyStatus.RESUELTA || estado === EmergencyStatus.CANCELADA
            ? "Esta emergencia ya está en un estado final."
            : estado === EmergencyStatus.ASIGNADA || estado === EmergencyStatus.EN_ATENCION
              ? "Ya tiene recursos asignados."
              : "La emergencia debe estar en estado Priorizada antes de asignar recursos."}
        </p>
      </Card>
    );
  }

  if (result) {
    return (
      <Card>
        <span className="eyebrow mb-1 block">Asignar recurso</span>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ok)" }} />
          Recurso asignado — despacho <span className="data-mono">{result.id}</span>
        </div>
        {result.sincronizacionIntake && !result.sincronizacionIntake.ok && (
          <p className="text-xs mt-2" style={{ color: "var(--warn)" }}>
            El recurso se reservó, pero no se pudo sincronizar el estado con Intake & Triage:{" "}
            {result.sincronizacionIntake.mensaje}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <span className="eyebrow">Asignar recurso</span>

      {loadingResources && <p className="text-sm text-text-muted data-mono">Cargando recursos disponibles…</p>}

      {!loadingResources && resources.length === 0 && (
        <p className="text-sm text-text-secondary">No hay recursos disponibles en esta ciudad ahora mismo.</p>
      )}

      {!loadingResources && resources.length > 0 && (
        <>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Recurso disponible</label>
            <select
              className="focus-ring w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} · {RESOURCE_TYPE_LABEL[r.tipo as keyof typeof RESOURCE_TYPE_LABEL] ?? r.tipo} · {r.organismo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Notas (opcional)</label>
            <input
              type="text"
              className="focus-ring w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Despachado por ruta norte"
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <Button onClick={handleAssign} disabled={submitting || !selected} className="self-start">
            {submitting ? "Asignando..." : "Asignar recurso"}
          </Button>
        </>
      )}
    </Card>
  );
}
