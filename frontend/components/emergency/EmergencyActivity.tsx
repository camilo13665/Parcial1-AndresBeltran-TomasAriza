"use client";

import { useEffect, useState } from "react";
import { dispatchesApi, notificationsApi, type DispatchRecord, type StatusChangeNotification } from "@/services/api/client";
import { Card } from "@/components/ui/Card";
import { STATUS_LABEL } from "@/lib/constants";
import { EmergencyStatus } from "@/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(estado: string): string {
  return STATUS_LABEL[estado as EmergencyStatus] ?? estado;
}

/**
 * Actividad real de la emergencia, consultada directamente a Dispatch
 * (`GET /dispatches?emergenciaId=`) y Notification
 * (`GET /notifications?emergenciaId=`) — no es un timeline simulado.
 */
export function EmergencyActivity({ emergenciaId, reloadKey }: { emergenciaId: string; reloadKey: number }) {
  const [dispatches, setDispatches] = useState<DispatchRecord[] | null>(null);
  const [notifications, setNotifications] = useState<StatusChangeNotification[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    dispatchesApi
      .list(emergenciaId)
      .then((res) => !cancelled && setDispatches(res.data))
      .catch(() => !cancelled && setDispatches([]));
    notificationsApi
      .list(emergenciaId)
      .then((res) => !cancelled && setNotifications(res.data))
      .catch(() => !cancelled && setNotifications([]));
    return () => {
      cancelled = true;
    };
  }, [emergenciaId, reloadKey]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <span className="eyebrow mb-3 block">Recursos despachados</span>
        {dispatches === null && <p className="text-sm text-text-muted data-mono">Cargando…</p>}
        {dispatches !== null && dispatches.length === 0 && (
          <p className="text-sm text-text-secondary">Aún no se han asignado recursos.</p>
        )}
        {dispatches !== null && dispatches.length > 0 && (
          <ul className="flex flex-col gap-3">
            {dispatches.map((d) => (
              <li key={d.id} className="text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="data-mono text-accent">{d.id}</span>
                  <span className="data-mono text-xs text-text-muted">{formatTime(d.fechaAsignacion)}</span>
                </div>
                <div className="text-text-secondary mt-1">
                  {d.recursoIds.map((rid) => (
                    <span key={rid} className="data-mono mr-2">
                      {rid}
                    </span>
                  ))}
                </div>
                {d.notas && <div className="text-text-muted text-xs mt-1">{d.notas}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <span className="eyebrow mb-3 block">Notificaciones</span>
        {notifications === null && <p className="text-sm text-text-muted data-mono">Cargando…</p>}
        {notifications !== null && notifications.length === 0 && (
          <p className="text-sm text-text-secondary">Sin eventos todavía.</p>
        )}
        {notifications !== null && notifications.length > 0 && (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li key={n.id} className="text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="text-text-primary">
                    {statusLabel(n.estadoAnterior)} → {statusLabel(n.estadoNuevo)}
                  </span>
                  <span className="data-mono text-xs text-text-muted">{formatTime(n.fechaCreacion)}</span>
                </div>
                <div className="text-text-secondary text-xs mt-1">{n.mensaje}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
