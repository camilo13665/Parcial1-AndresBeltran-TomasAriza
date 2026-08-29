"use client";

import { use, useCallback, useEffect, useState } from "react";
import { NavBar } from "@/components/ui/NavBar";
import { Card } from "@/components/ui/Card";
import { PriorityBadge } from "@/components/emergency/PriorityBadge";
import { StatusTimeline } from "@/components/emergency/StatusTimeline";
import { StatusActions } from "@/components/emergency/StatusActions";
import { AssignResourcePanel } from "@/components/emergency/AssignResourcePanel";
import { EmergencyActivity } from "@/components/emergency/EmergencyActivity";
import { getEmergencyById } from "@/lib/mock-data";
import { CITY_LABEL, EMERGENCY_TYPE_META } from "@/lib/constants";
import { LinkButton } from "@/components/ui/Button";
import { Emergency } from "@/types";
import { emergenciesApi, ApiError } from "@/services/api/client";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

const FIELD_LABEL: Record<string, string> = {
  personasAtrapadasOHeridas: "Personas atrapadas o heridas",
  riesgoInminente: "Riesgo inminente",
  fugaDeGas: "Fuga de gas",
  fuego: "Fuego",
  otrosRiesgos: "Otros riesgos",
  numeroAdultos: "Adultos",
  numeroNinos: "Niños",
  numeroAdultosMayores: "Adultos mayores",
  requerimientosAccesibilidad: "Accesibilidad",
  estadoHabitabilidadVivienda: "Habitabilidad de la vivienda",
  categoriaInsumo: "Categoría del insumo",
  cantidadRequerida: "Cantidad requerida",
  tipoEdificacion: "Tipo de edificación",
  nivelAgrietamiento: "Nivel de agrietamiento",
  asentamiento: "Asentamiento",
  riesgoColapsoSobreVias: "Riesgo de colapso sobre vías",
};

function fieldLabel(key: string): string {
  return FIELD_LABEL[key] ?? key;
}

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

type LoadState = "loading" | "live" | "offline" | "not-found";

export default function EmergenciaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await emergenciesApi.get(id);
        if (cancelled) return;
        setEmergency(data as unknown as Emergency);
        setState("live");
      } catch (err) {
        if (cancelled) return;
        const mock = getEmergencyById(id);
        if (err instanceof ApiError && err.status === undefined) {
          // backend apagado — usar mock si existe
          if (mock) {
            setEmergency(mock);
            setState("offline");
          } else {
            setState("not-found");
          }
        } else {
          // backend respondió pero no encontró el recurso
          setState(mock ? "offline" : "not-found");
          if (mock) setEmergency(mock);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const handleChanged = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  if (state === "loading") {
    return (
      <>
        <NavBar />
        <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10">
          <span className="text-sm text-text-muted data-mono">Cargando…</span>
        </main>
      </>
    );
  }

  if (state === "not-found" || !emergency) {
    return (
      <>
        <NavBar />
        <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-4">
          <h1 className="text-xl font-semibold">No encontramos esta emergencia</h1>
          <p className="text-text-secondary text-sm">
            Verifica el identificador o que el backend esté corriendo.
          </p>
          <LinkButton href="/" variant="secondary" className="self-start">
            Volver a la página principal
          </LinkButton>
        </main>
      </>
    );
  }

  const meta = EMERGENCY_TYPE_META[emergency.tipo];

  return (
    <>
      <NavBar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 py-10 flex flex-col gap-6">
        {state === "offline" && (
          <div
            className="rounded-lg border px-4 py-3 text-sm flex items-center gap-2"
            style={{ borderColor: "var(--border-strong)", background: "var(--surface-raised)", color: "var(--text-secondary)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--danger)" }} />
            No se pudo conectar con Intake &amp; Triage — mostrando datos de ejemplo.
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="eyebrow">Emergencia</span>
            <h1 className="data-mono text-2xl font-semibold">{emergency.id}</h1>
          </div>
          <PriorityBadge priority={emergency.prioridad} />
        </div>

        <Card>
          <span className="eyebrow mb-3 block">Estado</span>
          <StatusTimeline status={emergency.estado} />
          {state === "live" && (
            <div className="mt-4 pt-4 border-t border-border">
              <StatusActions emergency={emergency} onChanged={handleChanged} />
            </div>
          )}
          {state === "offline" && (
            <p className="text-xs text-text-muted mt-3">
              Las acciones de operador requieren que el backend esté corriendo.
            </p>
          )}
        </Card>

        {state === "live" && (
          <AssignResourcePanel
            emergenciaId={emergency.id}
            ciudad={emergency.ciudad}
            estado={emergency.estado}
            onAssigned={handleChanged}
          />
        )}

        <Card className="flex flex-col gap-4">
          <div>
            <span className="eyebrow">Tipo</span>
            <p className="mt-1">
              {meta.code} · {meta.label}
            </p>
          </div>
          <div>
            <span className="eyebrow">Descripción</span>
            <p className="mt-1 text-text-secondary">{emergency.descripcion}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="eyebrow">Ciudad</span>
              <p className="mt-1">{CITY_LABEL[emergency.ciudad]}</p>
            </div>
            <div>
              <span className="eyebrow">Ubicación</span>
              <p className="mt-1 data-mono text-sm">
                {emergency.latitud.toFixed(4)}, {emergency.longitud.toFixed(4)}
              </p>
            </div>
            <div>
              <span className="eyebrow">Creada</span>
              <p className="mt-1 data-mono text-sm text-text-secondary">{formatDateTime(emergency.fechaCreacion)}</p>
            </div>
            <div>
              <span className="eyebrow">Actualizada</span>
              <p className="mt-1 data-mono text-sm text-text-secondary">{formatDateTime(emergency.fechaActualizacion)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <span className="eyebrow mb-3 block">Información adicional</span>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(emergency.datosEspecificos).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                <dt className="text-sm text-text-secondary">{fieldLabel(key)}</dt>
                <dd className="text-sm text-text-primary text-right">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {state === "live" && <EmergencyActivity emergenciaId={emergency.id} reloadKey={reloadKey} />}

        <LinkButton href="/" variant="ghost" className="p-0 self-start">
          ← Volver a la página principal
        </LinkButton>
      </main>
    </>
  );
}
