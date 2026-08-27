"use client";

import { useEffect, useState } from "react";
import { zonesApi, ApiError, type ZoneStat } from "@/services/api/client";
import { Card } from "@/components/ui/Card";

/**
 * Estadísticas por zona obtenidas de Geospatial (`GET /zones/stats`), que
 * a su vez consulta a Intake & Triage por HTTP y agrega en el momento.
 * A diferencia del MapPlaceholder (que cuenta localmente sobre la lista
 * ya filtrada en el dashboard), este panel demuestra la comunicación real
 * entre microservicios.
 */
export function ZoneStatsPanel({ reloadKey }: { reloadKey: number }) {
  const [stats, setStats] = useState<ZoneStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    zonesApi
      .stats()
      .then((res) => {
        if (cancelled) return;
        setStats(res.data);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudo consultar Geospatial.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Estadísticas por zona</span>
        <span className="text-[10px] data-mono text-text-muted">vía geospatial → intake</span>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {!error && stats === null && <p className="text-sm text-text-muted data-mono">Cargando…</p>}

      {!error && stats && (
        <ul className="flex flex-col gap-3">
          {stats.map((z) => (
            <li key={z.ciudad} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">{z.nombre}</span>
              <div className="flex items-center gap-2 data-mono text-xs">
                <span className="text-text-secondary">{z.total} total</span>
                {z.porPrioridad.CRITICA > 0 && (
                  <span style={{ color: "var(--p1-critica)" }}>{z.porPrioridad.CRITICA} P1</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
