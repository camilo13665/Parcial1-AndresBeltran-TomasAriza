"use client";

import { useState } from "react";
import { Emergency, EmergencyStatus } from "@/types";
import { STATUS_LABEL, nextValidStatus, canCancel } from "@/lib/constants";
import { emergenciesApi, ApiError } from "@/services/api/client";
import { Button } from "@/components/ui/Button";
import { useAdminSession } from "@/hooks/useAdminSession";

interface StatusActionsProps {
  emergency: Pick<Emergency, "id" | "estado">;
  onChanged: () => void;
  compact?: boolean;
}

/**
 * Botones para que un operador avance o cancele el estado de una
 * emergencia. En PRIORIZADA no se ofrece "avanzar": ese salto a ASIGNADA
 * solo debe ocurrir a través de la asignación de un recurso en Dispatch
 * (ver AssignResourcePanel), que es quien realmente notifica el cambio.
 */
export function StatusActions({ emergency, onChanged, compact = false }: StatusActionsProps) {
  const isAdmin = useAdminSession();
  const [loading, setLoading] = useState<EmergencyStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = nextValidStatus(emergency.estado);
  const showAdvance = next !== null && emergency.estado !== EmergencyStatus.PRIORIZADA;
  const showCancel = canCancel(emergency.estado);

  if (isAdmin !== true) return null;

  async function handleTransition(estado: EmergencyStatus) {
    setError(null);
    setLoading(estado);
    try {
      await emergenciesApi.updateStatus(emergency.id, estado);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    } finally {
      setLoading(null);
    }
  }

  if (!showAdvance && !showCancel) {
    return <span className="text-xs text-text-muted">Sin acciones — estado final</span>;
  }

  return (
    <div className={`flex ${compact ? "flex-row items-center gap-2" : "flex-col gap-2"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {showAdvance && next && (
          <Button
            size={compact ? "md" : "md"}
            variant="primary"
            disabled={loading !== null}
            onClick={() => handleTransition(next)}
            className={compact ? "px-3 py-1.5 text-xs" : ""}
          >
            {loading === next ? "Avanzando..." : `Avanzar a ${STATUS_LABEL[next]}`}
          </Button>
        )}
        {emergency.estado === EmergencyStatus.PRIORIZADA && (
          <span className="text-xs text-text-muted">Asigna un recurso para avanzar a Asignada</span>
        )}
        {showCancel && (
          <Button
            size="md"
            variant="ghost"
            disabled={loading !== null}
            onClick={() => handleTransition(EmergencyStatus.CANCELADA)}
            className={compact ? "px-2 py-1.5 text-xs text-danger" : "text-danger"}
            style={{ color: "var(--danger)" }}
          >
            {loading === EmergencyStatus.CANCELADA ? "Cancelando..." : "Cancelar"}
          </Button>
        )}
      </div>
      {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
