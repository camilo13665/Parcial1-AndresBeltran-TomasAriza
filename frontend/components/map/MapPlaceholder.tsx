"use client";

import { useEffect, useRef, useState } from "react";
import type { Emergency, EmergencyResource } from "@/types";
import { CITY_COORDS, CITY_LABEL, CITY_LIST, PRIORITY_META } from "@/lib/constants";

interface MapPlaceholderProps {
  emergencies?: Emergency[];
  resources?: EmergencyResource[];
  className?: string;
}

/**
 * Placeholder del panel de mapa interactivo.
 *
 * Todavía no integra un proveedor de mapas (se decidirá en una fase
 * posterior). Por ahora muestra la concentración relativa de emergencias
 * por zona a partir de los datos mock, dejando el layout y la superficie
 * preparados para el mapa real de Chocó, Pereira, Cali y Manizales.
 */
export function MapPlaceholder({ emergencies = [], resources = [], className = "" }: MapPlaceholderProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layers = useRef<import("leaflet").LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let currentMap: import("leaflet").Map | null = null;

    async function initialize() {
      if (!mapElement.current || map.current) return;
      const leaflet = await import("leaflet");
      if (cancelled || !mapElement.current) return;
      currentMap = leaflet.map(mapElement.current).setView([4.55, -76.1], 7);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        })
        .addTo(currentMap);
      map.current = currentMap;
      layers.current = leaflet.layerGroup().addTo(currentMap);
      setMapReady(true);
    }

    initialize();
    return () => {
      cancelled = true;
      currentMap?.remove();
      map.current = null;
      layers.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function drawMap() {
      if (!map.current || !layers.current) return;
      const leaflet = await import("leaflet");
      if (cancelled) return;
      layers.current.clearLayers();

      CITY_LIST.forEach((city) => {
        const center = CITY_COORDS[city];
        leaflet
          .circle([center.lat, center.lng], {
            radius: city === "CHOCO" ? 40_000 : city === "PEREIRA" ? 25_000 : city === "CALI" ? 30_000 : 20_000,
            color: "#2dd4cf",
            fillColor: "#2dd4cf",
            fillOpacity: 0.08,
            weight: 1,
          })
          .bindTooltip(`${CITY_LABEL[city]} · zona monitoreada`)
          .addTo(layers.current!);
      });

      emergencies.forEach((emergency) => {
        const color = PRIORITY_META[emergency.prioridad].colorVar;
        const icon = leaflet.divIcon({
          className: "emergency-marker",
          html: `<span style="background:${color}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        leaflet
          .marker([emergency.latitud, emergency.longitud], { icon })
          .bindPopup(`<strong>${emergency.id}</strong><br>${emergency.descripcion}<br>Estado: ${emergency.estado}`)
          .addTo(layers.current!);
      });

      const routeRequests = emergencies.map(async (emergency) => {
        const center = CITY_COORDS[emergency.ciudad];
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${center.lng},${center.lat};${emergency.longitud},${emergency.latitud}?overview=full&geometries=geojson`,
        );
        if (!response.ok) return null;
        const data = (await response.json()) as { routes?: { geometry?: { coordinates: [number, number][] } }[] };
        return data.routes?.[0]?.geometry?.coordinates ?? null;
      });

      setRoutesLoading(routeRequests.length > 0);
      const routes = await Promise.allSettled(routeRequests);
      if (cancelled) return;
      routes.forEach((result) => {
        if (result.status !== "fulfilled" || !result.value) return;
        leaflet
          .polyline(result.value.map(([lng, lat]) => [lat, lng] as [number, number]), {
            color: "#f7891a",
            weight: 3,
            opacity: 0.8,
            dashArray: "7 7",
          })
          .bindTooltip("Ruta estimada desde la zona base")
          .addTo(layers.current!);
      });
      setRoutesLoading(false);
    }

    drawMap();
    return () => {
      cancelled = true;
    };
  }, [emergencies, resources, mapReady]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border ${className}`}>
      <div ref={mapElement} className="min-h-[360px] w-full" />
      <div className="absolute left-3 top-3 z-[1000] rounded bg-bg-elevated/90 px-3 py-2 shadow-lg">
        <div className="eyebrow">Mapa operativo · Leaflet</div>
        <div className="mt-1 text-[10px] data-mono text-text-muted">
          {emergencies.length} emergencias · {resources.length} recursos · {routesLoading ? "calculando rutas…" : "rutas actualizadas"}
        </div>
      </div>
    </div>
  );
}
