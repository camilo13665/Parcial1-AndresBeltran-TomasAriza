"use client";

import { useEffect, useState } from "react";
import { ApiError, type ZoneStat, zonesApi } from "@/services/api/client";
import { Card } from "@/components/ui/Card";

const REFRESH_INTERVAL_MS = 10_000;

export function MonitoredZones() {
  const [zones, setZones] = useState<ZoneStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadZones = async () => {
      try {
        const response = await zonesApi.stats();
        if (cancelled) return;
        setZones(response.data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudieron consultar las zonas.");
      }
    };

    loadZones();
    const intervalId = window.setInterval(loadZones, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Zonas monitoreadas</span>
        <span className="text-[10px] data-mono text-text-muted">
          {error ? "sin conexión" : "actualización en vivo"}
        </span>
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}

      {!error && zones === null && <p className="text-sm text-text-muted data-mono mt-3">Cargando…</p>}

      {zones && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
          {zones.map((zone) => (
            <Card key={zone.ciudad} className="flex flex-col gap-1">
              <span className="text-text-primary font-medium">{zone.nombre}</span>
              <span className="data-mono text-2xl text-text-secondary">{zone.total}</span>
              <span className="text-xs text-text-muted">solicitudes registradas</span>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}