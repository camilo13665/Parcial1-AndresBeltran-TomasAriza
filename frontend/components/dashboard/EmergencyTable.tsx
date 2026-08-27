import Link from "next/link";
import { Emergency, EmergencyStatus } from "@/types";
import { CITY_LABEL, EMERGENCY_TYPE_META, nextValidStatus, STATUS_LABEL } from "@/lib/constants";
import { PriorityBadge } from "@/components/emergency/PriorityBadge";
import { StatusBadge } from "@/components/emergency/StatusBadge";
import { emergenciesApi, ApiError } from "@/services/api/client";
import { useState } from "react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface QuickActionProps {
  emergency: Emergency;
  onChanged: () => void;
}

/**
 * Acción rápida de una sola fila: avanza al siguiente estado sin salir del
 * dashboard. Para asignar recursos (que requiere elegir de una lista) o
 * cancelar, el operador entra al detalle — ahí vive el flujo completo.
 */
function QuickAction({ emergency, onChanged }: QuickActionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = nextValidStatus(emergency.estado);
  const showAdvance = next !== null && emergency.estado !== EmergencyStatus.PRIORIZADA;

  if (!showAdvance) {
    return (
      <Link href={`/emergencia/${emergency.id}`} className="focus-ring text-xs text-accent hover:underline">
        Gestionar →
      </Link>
    );
  }

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      await emergenciesApi.updateStatus(emergency.id, next as EmergencyStatus);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="focus-ring text-xs px-2 py-1 rounded-md border border-border-strong text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-40"
        title={`Avanzar a ${STATUS_LABEL[next as EmergencyStatus]}`}
      >
        {loading ? "..." : `→ ${STATUS_LABEL[next as EmergencyStatus]}`}
      </button>
      <Link href={`/emergencia/${emergency.id}`} className="focus-ring text-xs text-text-muted hover:text-accent">
        más
      </Link>
      {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

export function EmergencyTable({ emergencies, onChanged }: { emergencies: Emergency[]; onChanged: () => void }) {
  if (emergencies.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-text-secondary">
        No hay emergencias que coincidan con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="eyebrow py-2 pr-4 font-medium">ID</th>
            <th className="eyebrow py-2 pr-4 font-medium">Tipo</th>
            <th className="eyebrow py-2 pr-4 font-medium">Prioridad</th>
            <th className="eyebrow py-2 pr-4 font-medium">Ciudad</th>
            <th className="eyebrow py-2 pr-4 font-medium">Estado</th>
            <th className="eyebrow py-2 pr-4 font-medium">Actualizada</th>
            <th className="eyebrow py-2 pr-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {emergencies.map((e) => (
            <tr key={e.id} className="border-b border-border/60 last:border-0 hover:bg-surface-raised transition-colors">
              <td className="py-3 pr-4">
                <Link
                  href={`/emergencia/${e.id}`}
                  className="focus-ring data-mono text-accent hover:underline"
                >
                  {e.id}
                </Link>
              </td>
              <td className="py-3 pr-4 text-text-secondary">{EMERGENCY_TYPE_META[e.tipo].shortLabel}</td>
              <td className="py-3 pr-4">
                <PriorityBadge priority={e.prioridad} compact />
              </td>
              <td className="py-3 pr-4 text-text-secondary">{CITY_LABEL[e.ciudad]}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={e.estado} />
              </td>
              <td className="py-3 pr-4 data-mono text-text-muted text-xs">{formatTime(e.fechaActualizacion)}</td>
              <td className="py-3 pr-4">
                <QuickAction emergency={e} onChanged={onChanged} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
