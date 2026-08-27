"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notificationsApi, ApiError, type StatusChangeNotification } from "@/services/api/client";
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
 * Feed de los eventos más recientes registrados por Notification &
 * Status Broadcast — el destino real de los avisos que Intake & Triage
 * dispara en cada cambio de estado.
 */
export function NotificationsFeed({ reloadKey }: { reloadKey: number }) {
  const [notifications, setNotifications] = useState<StatusChangeNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    notificationsApi
      .list()
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.data.slice(0, 8));
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudo consultar Notification.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <Card>
      <span className="eyebrow mb-3 block">Notificaciones recientes</span>

      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {!error && notifications === null && <p className="text-sm text-text-muted data-mono">Cargando…</p>}

      {!error && notifications !== null && notifications.length === 0 && (
        <p className="text-sm text-text-secondary">Sin eventos todavía.</p>
      )}

      {!error && notifications !== null && notifications.length > 0 && (
        <ul className="flex flex-col gap-3">
          {notifications.map((n) => (
            <li key={n.id} className="text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0">
              <div className="flex justify-between items-center gap-2">
                <Link href={`/emergencia/${n.emergenciaId}`} className="focus-ring data-mono text-accent hover:underline">
                  {n.emergenciaId}
                </Link>
                <span className="data-mono text-[11px] text-text-muted shrink-0">{formatTime(n.fechaCreacion)}</span>
              </div>
              <div className="text-text-secondary text-xs mt-0.5">
                {statusLabel(n.estadoAnterior)} → {statusLabel(n.estadoNuevo)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
