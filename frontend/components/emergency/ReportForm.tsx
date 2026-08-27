"use client";

import { useState } from "react";
import { City, EmergencyType } from "@/types";
import { CITY_LABEL, CITY_LIST, CITY_COORDS, EMERGENCY_TYPE_META } from "@/lib/constants";
import { SelectCard } from "@/components/emergency/SelectCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emergenciesApi, ApiError } from "@/services/api/client";

const ACCENT_BY_CODE: Record<string, string> = {
  P1: "var(--p1-critica)",
  P2: "var(--p2-alta)",
  P3: "var(--p3-media)",
  P4: "var(--p4-baja)",
};

const INPUT_CLASS =
  "focus-ring w-full bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted";
const LABEL_CLASS = "text-sm text-text-secondary mb-1 block";

// --- Estado de los campos específicos por tipo -----------------------------

interface P1Fields {
  personasAtrapadasOHeridas: string;
  riesgoInminente: boolean;
  fugaDeGas: boolean;
  fuego: boolean;
  otrosRiesgos: string;
}
const P1_DEFAULT: P1Fields = { personasAtrapadasOHeridas: "", riesgoInminente: false, fugaDeGas: false, fuego: false, otrosRiesgos: "" };

interface P2Fields {
  numeroAdultos: string;
  numeroNinos: string;
  numeroAdultosMayores: string;
  requerimientosAccesibilidad: string;
  estadoHabitabilidadVivienda: "HABITABLE" | "NO_HABITABLE" | "PARCIALMENTE_HABITABLE";
}
const P2_DEFAULT: P2Fields = {
  numeroAdultos: "",
  numeroNinos: "",
  numeroAdultosMayores: "",
  requerimientosAccesibilidad: "",
  estadoHabitabilidadVivienda: "NO_HABITABLE",
};

interface P3Fields {
  categoriaInsumo: "AGUA_POTABLE" | "RACIONES" | "KIT_PRIMEROS_AUXILIOS" | "MEDICAMENTOS_CRONICOS";
  cantidadRequerida: string;
}
const P3_DEFAULT: P3Fields = { categoriaInsumo: "AGUA_POTABLE", cantidadRequerida: "" };

interface P4Fields {
  tipoEdificacion: string;
  nivelAgrietamiento: "LEVE" | "MODERADO" | "SEVERO";
  asentamiento: boolean;
  riesgoColapsoSobreVias: boolean;
}
const P4_DEFAULT: P4Fields = { tipoEdificacion: "", nivelAgrietamiento: "LEVE", asentamiento: false, riesgoColapsoSobreVias: false };

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

export function ReportForm() {
  const [city, setCity] = useState<City | null>(null);
  const [type, setType] = useState<EmergencyType | null>(null);
  const [description, setDescription] = useState("");

  const [p1, setP1] = useState<P1Fields>(P1_DEFAULT);
  const [p2, setP2] = useState<P2Fields>(P2_DEFAULT);
  const [p3, setP3] = useState<P3Fields>(P3_DEFAULT);
  const [p4, setP4] = useState<P4Fields>(P4_DEFAULT);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  function buildDatosEspecificos(): Record<string, unknown> | null {
    if (!type) return null;
    switch (type) {
      case EmergencyType.SEARCH_RESCUE_MEDICAL:
        return {
          personasAtrapadasOHeridas: Number(p1.personasAtrapadasOHeridas || 0),
          riesgoInminente: p1.riesgoInminente,
          fugaDeGas: p1.fugaDeGas,
          fuego: p1.fuego,
          ...(p1.otrosRiesgos ? { otrosRiesgos: p1.otrosRiesgos } : {}),
        };
      case EmergencyType.SHELTER_TEMPORARY_HOUSING:
        return {
          numeroAdultos: Number(p2.numeroAdultos || 0),
          numeroNinos: Number(p2.numeroNinos || 0),
          numeroAdultosMayores: Number(p2.numeroAdultosMayores || 0),
          estadoHabitabilidadVivienda: p2.estadoHabitabilidadVivienda,
          ...(p2.requerimientosAccesibilidad ? { requerimientosAccesibilidad: p2.requerimientosAccesibilidad } : {}),
        };
      case EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID:
        return {
          categoriaInsumo: p3.categoriaInsumo,
          cantidadRequerida: Number(p3.cantidadRequerida || 0),
        };
      case EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT:
        return {
          tipoEdificacion: p4.tipoEdificacion,
          nivelAgrietamiento: p4.nivelAgrietamiento,
          asentamiento: p4.asentamiento,
          riesgoColapsoSobreVias: p4.riesgoColapsoSobreVias,
        };
    }
  }

  async function handleSubmit() {
    if (!city || !type) return;
    setError(null);

    const datosEspecificos = buildDatosEspecificos();
    if (!datosEspecificos) return;

    const base = CITY_COORDS[city];
    const jitter = () => (Math.random() - 0.5) * 0.01;

    setSubmitting(true);
    try {
      const emergency = await emergenciesApi.create({
        tipo: type,
        ciudad: city,
        descripcion: description.trim() || "Sin descripción adicional.",
        latitud: base.lat + jitter(),
        longitud: base.lng + jitter(),
        datosEspecificos,
      });
      setSubmittedId(emergency.id);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === undefined) {
          setError("No fue posible conectar con el servicio de recepción de emergencias. Verifica que el backend esté corriendo.");
        } else if (err.details?.length) {
          setError(`${err.message}: ${err.details.map((d) => `${d.path} (${d.message})`).join(", ")}`);
        } else {
          setError(err.message);
        }
      } else {
        setError("Ocurrió un error inesperado al enviar tu solicitud.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <Card className="text-center py-10 flex flex-col items-center gap-3">
        <span className="w-3 h-3 rounded-full" style={{ background: "var(--ok)" }} aria-hidden />
        <h2 className="text-lg font-semibold">Solicitud recibida</h2>
        <p className="text-text-secondary max-w-sm">
          Guarda este identificador para consultar el estado de tu emergencia.
        </p>
        <div className="data-mono text-2xl font-semibold text-accent mt-2">{submittedId}</div>
        <div className="flex gap-3 mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setSubmittedId(null);
              setCity(null);
              setType(null);
              setDescription("");
              setP1(P1_DEFAULT);
              setP2(P2_DEFAULT);
              setP3(P3_DEFAULT);
              setP4(P4_DEFAULT);
            }}
          >
            Reportar otra emergencia
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = `/emergencia/${submittedId}`)}>
            Ver estado →
          </Button>
        </div>
      </Card>
    );
  }

  const canSubmit = city !== null && type !== null && !submitting;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-sm font-semibold mb-3">1. ¿En qué ciudad estás?</h2>
        <div className="grid grid-cols-2 gap-3">
          {CITY_LIST.map((c) => (
            <SelectCard key={c} selected={city === c} onClick={() => setCity(c)} title={CITY_LABEL[c]} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">2. ¿Qué tipo de emergencia es?</h2>
        <div className="grid grid-cols-1 gap-3">
          {Object.values(EmergencyType).map((t) => {
            const meta = EMERGENCY_TYPE_META[t];
            return (
              <SelectCard
                key={t}
                selected={type === t}
                onClick={() => setType(t)}
                title={`${meta.code} · ${meta.shortLabel}`}
                subtitle={meta.description}
                accentColor={ACCENT_BY_CODE[meta.code]}
              />
            );
          })}
        </div>
      </section>

      {type === EmergencyType.SEARCH_RESCUE_MEDICAL && (
        <section>
          <h2 className="text-sm font-semibold mb-3">3. Detalles de rescate</h2>
          <Card className="flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS}>Personas atrapadas o heridas</label>
              <input
                type="number"
                min={0}
                className={INPUT_CLASS}
                value={p1.personasAtrapadasOHeridas}
                onChange={(e) => setP1({ ...p1, personasAtrapadasOHeridas: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <Checkbox checked={p1.riesgoInminente} onChange={(v) => setP1({ ...p1, riesgoInminente: v })} label="Riesgo inminente" />
              <Checkbox checked={p1.fugaDeGas} onChange={(v) => setP1({ ...p1, fugaDeGas: v })} label="Fuga de gas" />
              <Checkbox checked={p1.fuego} onChange={(v) => setP1({ ...p1, fuego: v })} label="Fuego" />
            </div>
            <div>
              <label className={LABEL_CLASS}>Otros riesgos (opcional)</label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={p1.otrosRiesgos}
                onChange={(e) => setP1({ ...p1, otrosRiesgos: e.target.value })}
              />
            </div>
          </Card>
        </section>
      )}

      {type === EmergencyType.SHELTER_TEMPORARY_HOUSING && (
        <section>
          <h2 className="text-sm font-semibold mb-3">3. Detalles del grupo familiar</h2>
          <Card className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>Adultos</label>
                <input type="number" min={0} className={INPUT_CLASS} value={p2.numeroAdultos} onChange={(e) => setP2({ ...p2, numeroAdultos: e.target.value })} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Niños</label>
                <input type="number" min={0} className={INPUT_CLASS} value={p2.numeroNinos} onChange={(e) => setP2({ ...p2, numeroNinos: e.target.value })} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Adultos mayores</label>
                <input type="number" min={0} className={INPUT_CLASS} value={p2.numeroAdultosMayores} onChange={(e) => setP2({ ...p2, numeroAdultosMayores: e.target.value })} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Estado de la vivienda</label>
              <select
                className={INPUT_CLASS}
                value={p2.estadoHabitabilidadVivienda}
                onChange={(e) => setP2({ ...p2, estadoHabitabilidadVivienda: e.target.value as P2Fields["estadoHabitabilidadVivienda"] })}
              >
                <option value="NO_HABITABLE">No habitable</option>
                <option value="PARCIALMENTE_HABITABLE">Parcialmente habitable</option>
                <option value="HABITABLE">Habitable</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Requerimientos de accesibilidad (opcional)</label>
              <input type="text" className={INPUT_CLASS} value={p2.requerimientosAccesibilidad} onChange={(e) => setP2({ ...p2, requerimientosAccesibilidad: e.target.value })} />
            </div>
          </Card>
        </section>
      )}

      {type === EmergencyType.BASIC_SUPPLIES_HUMANITARIAN_AID && (
        <section>
          <h2 className="text-sm font-semibold mb-3">3. Detalles del suministro</h2>
          <Card className="flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS}>Categoría del insumo</label>
              <select
                className={INPUT_CLASS}
                value={p3.categoriaInsumo}
                onChange={(e) => setP3({ ...p3, categoriaInsumo: e.target.value as P3Fields["categoriaInsumo"] })}
              >
                <option value="AGUA_POTABLE">Agua potable</option>
                <option value="RACIONES">Raciones</option>
                <option value="KIT_PRIMEROS_AUXILIOS">Kit de primeros auxilios</option>
                <option value="MEDICAMENTOS_CRONICOS">Medicamentos crónicos</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Cantidad requerida</label>
              <input type="number" min={1} className={INPUT_CLASS} value={p3.cantidadRequerida} onChange={(e) => setP3({ ...p3, cantidadRequerida: e.target.value })} />
            </div>
          </Card>
        </section>
      )}

      {type === EmergencyType.STRUCTURAL_DAMAGE_ASSESSMENT && (
        <section>
          <h2 className="text-sm font-semibold mb-3">3. Detalles de la estructura</h2>
          <Card className="flex flex-col gap-3">
            <div>
              <label className={LABEL_CLASS}>Tipo de edificación</label>
              <input type="text" className={INPUT_CLASS} placeholder="Ej. Vivienda unifamiliar, 2 niveles" value={p4.tipoEdificacion} onChange={(e) => setP4({ ...p4, tipoEdificacion: e.target.value })} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Nivel de agrietamiento</label>
              <select
                className={INPUT_CLASS}
                value={p4.nivelAgrietamiento}
                onChange={(e) => setP4({ ...p4, nivelAgrietamiento: e.target.value as P4Fields["nivelAgrietamiento"] })}
              >
                <option value="LEVE">Leve</option>
                <option value="MODERADO">Moderado</option>
                <option value="SEVERO">Severo</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <Checkbox checked={p4.asentamiento} onChange={(v) => setP4({ ...p4, asentamiento: v })} label="Hay asentamiento" />
              <Checkbox checked={p4.riesgoColapsoSobreVias} onChange={(v) => setP4({ ...p4, riesgoColapsoSobreVias: v })} label="Riesgo de colapso sobre vías" />
            </div>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold mb-3">4. Cuéntanos qué está pasando</h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe brevemente la situación... (mínimo 10 caracteres)"
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
        />
      </section>

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--danger)", background: "var(--p1-critica-soft)", color: "var(--text-primary)" }}
        >
          {error}
        </div>
      )}

      <Button size="lg" disabled={!canSubmit} onClick={handleSubmit} className="w-full">
        {submitting ? "Enviando..." : "Enviar solicitud"}
      </Button>
    </div>
  );
}
