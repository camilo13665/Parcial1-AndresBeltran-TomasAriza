import { NavBar } from "@/components/ui/NavBar";
import { SystemStatusBar } from "@/components/dashboard/SystemStatusBar";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MonitoredZones } from "@/components/home/MonitoredZones";
import { EmergencyLookup } from "@/components/home/EmergencyLookup";
import { MOCK_EMERGENCIES } from "@/lib/mock-data";

export default function HomePage() {
  const activeCount = MOCK_EMERGENCIES.filter((e) => e.estado !== "RESUELTA" && e.estado !== "CANCELADA").length;

  return (
    <>
      <NavBar />
      <SystemStatusBar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-14 flex flex-col gap-16">
        <section className="flex flex-col gap-6 max-w-2xl">
          <span className="eyebrow">Chocó · Pereira · Cali · Manizales</span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
            Coordina la respuesta a emergencias, zona por zona.
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Reporta lo que está pasando, dale seguimiento a tu solicitud, o consulta el estado de una solicitud. Ahora mismo hay{" "}
            <span className="data-mono text-text-primary">{activeCount}</span> emergencias activas
            registradas en el sistema.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton href="/reportar" size="lg">
              Reportar emergencia
            </LinkButton>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <span className="eyebrow">Ciudadano</span>
            <h3 className="font-semibold mt-2 mb-1">Reportar una emergencia</h3>
            <p className="text-sm text-text-secondary mb-4">
              Formulario simple, pocos pasos, pensado para usarse bajo presión.
            </p>
            <LinkButton href="/reportar" variant="ghost" className="p-0 justify-start">
              Ir a reportar →
            </LinkButton>
          </Card>

          <EmergencyLookup />

          <Card>
            <span className="eyebrow">Operador</span>
            <h3 className="font-semibold mt-2 mb-1">Centro de control</h3>
            <p className="text-sm text-text-secondary mb-4">
              Visualiza, filtra y asigna recursos a las emergencias activas.
            </p>
            <LinkButton href="/admin" variant="ghost" className="p-0 justify-start">
              Acceso de administrador →
            </LinkButton>
          </Card>
        </section>

        <MonitoredZones />
      </main>

    </>
  );
}
