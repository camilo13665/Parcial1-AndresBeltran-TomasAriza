"use client";

import { useServiceHealth, HealthState } from "@/hooks/useServiceHealth";

const SERVICE_LABELS: { key: "intake" | "dispatch" | "geospatial" | "notification"; label: string; port: number }[] = [
  { key: "intake", label: "INTAKE", port: 3001 },
  { key: "dispatch", label: "DISPATCH", port: 3002 },
  { key: "geospatial", label: "GEO", port: 3003 },
  { key: "notification", label: "NOTIF", port: 3004 },
];

const DOT_COLOR: Record<HealthState, string> = {
  checking: "var(--text-muted)",
  online: "var(--ok)",
  offline: "var(--danger)",
};

/**
 * Franja de estado del sistema — sondea /health de los cuatro
 * microservicios en vivo. Es el elemento distintivo de esta interfaz:
 * convierte la arquitectura de microservicios en algo visible para el
 * operador, igual que un panel de monitoreo de un centro de despacho real.
 */
export function SystemStatusBar() {
  const health = useServiceHealth();

  return (
    <div className="w-full border-b border-border bg-bg-elevated">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center gap-4 overflow-x-auto">
        <span className="eyebrow shrink-0">Estado del sistema</span>
        <div className="flex items-center gap-4 data-mono text-xs">
          {SERVICE_LABELS.map(({ key, label, port }) => {
            const state = health[key];
            return (
              <div key={key} className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${state === "checking" ? "pulse-dot" : ""}`}
                  style={{ background: DOT_COLOR[state] }}
                  aria-hidden
                />
                <span className="text-text-secondary">{label}</span>
                <span className="text-text-muted">:{port}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
