"use client";

import { City, EmergencyPriority, EmergencyStatus } from "@/types";
import { CITY_LABEL, CITY_LIST, PRIORITY_META, STATUS_LABEL } from "@/lib/constants";

export interface DashboardFilters {
  city: City | "ALL";
  priority: EmergencyPriority | "ALL";
  status: EmergencyStatus | "ALL";
}

interface FiltersBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}

const SELECT_CLASS =
  "focus-ring bg-bg-elevated border border-border rounded-md px-3 py-2 text-sm text-text-primary";

export function FiltersBar({ filters, onChange }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={SELECT_CLASS}
        value={filters.city}
        onChange={(e) => onChange({ ...filters, city: e.target.value as DashboardFilters["city"] })}
      >
        <option value="ALL">Todas las ciudades</option>
        {CITY_LIST.map((city) => (
          <option key={city} value={city}>
            {CITY_LABEL[city]}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as DashboardFilters["priority"] })}
      >
        <option value="ALL">Todas las prioridades</option>
        {Object.values(EmergencyPriority).map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_META[priority].label}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as DashboardFilters["status"] })}
      >
        <option value="ALL">Todos los estados</option>
        {Object.values(EmergencyStatus).map((status) => (
          <option key={status} value={status}>
            {STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </div>
  );
}
