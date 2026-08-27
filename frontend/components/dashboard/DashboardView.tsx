"use client";

import { useMemo, useState } from "react";
import { Emergency, EmergencyPriority } from "@/types";
import { EmergencyResource, ResourceStatus } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { FiltersBar, DashboardFilters } from "@/components/dashboard/FiltersBar";
import { EmergencyTable } from "@/components/dashboard/EmergencyTable";
import { MapPlaceholder } from "@/components/map/MapPlaceholder";
import { ZoneStatsPanel } from "@/components/dashboard/ZoneStatsPanel";
import { NotificationsFeed } from "@/components/dashboard/NotificationsFeed";
import { Card, CardHeader } from "@/components/ui/Card";

interface DashboardViewProps {
  emergencies: Emergency[];
  resources: EmergencyResource[];
  onChanged: () => void;
  reloadKey: number;
}

export function DashboardView({ emergencies, resources, onChanged, reloadKey }: DashboardViewProps) {
  const [filters, setFilters] = useState<DashboardFilters>({ city: "ALL", priority: "ALL", status: "ALL" });

  const filtered = useMemo(() => {
    return emergencies.filter((e) => {
      if (filters.city !== "ALL" && e.ciudad !== filters.city) return false;
      if (filters.priority !== "ALL" && e.prioridad !== filters.priority) return false;
      if (filters.status !== "ALL" && e.estado !== filters.status) return false;
      return true;
    });
  }, [emergencies, filters]);

  const counts = useMemo(
    () => ({
      total: emergencies.length,
      p1: emergencies.filter((e) => e.prioridad === EmergencyPriority.CRITICA).length,
      p2: emergencies.filter((e) => e.prioridad === EmergencyPriority.ALTA).length,
      p3: emergencies.filter((e) => e.prioridad === EmergencyPriority.MEDIA).length,
      p4: emergencies.filter((e) => e.prioridad === EmergencyPriority.BAJA).length,
      recursosDisponibles: resources.filter((r) => r.estado === ResourceStatus.DISPONIBLE).length,
    }),
    [emergencies, resources],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="P1 Críticas" value={counts.p1} color="var(--p1-critica)" />
        <StatCard label="P2 Altas" value={counts.p2} color="var(--p2-alta)" />
        <StatCard label="P3 Medias" value={counts.p3} color="var(--p3-media)" />
        <StatCard label="P4 Preventivas" value={counts.p4} color="var(--p4-baja)" />
        <StatCard label="Recursos disponibles" value={counts.recursosDisponibles} color="var(--ok)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padded={false} className="p-0">
            <div className="p-5 pb-0">
              <CardHeader>
                <h2 className="text-sm font-semibold">Emergencias</h2>
              </CardHeader>
              <FiltersBar filters={filters} onChange={setFilters} />
            </div>
            <div className="p-5 pt-4">
              <EmergencyTable emergencies={filtered} onChanged={onChanged} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <MapPlaceholder emergencies={filtered} resources={resources} />
          <ZoneStatsPanel reloadKey={reloadKey} />
          <NotificationsFeed reloadKey={reloadKey} />
        </div>
      </div>
    </div>
  );
}
