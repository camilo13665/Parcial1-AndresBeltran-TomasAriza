"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

export function EmergencyLookup() {
  const router = useRouter();
  const [emergencyId, setEmergencyId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = emergencyId.trim();

    if (!id) {
      setError("Ingresa el identificador de la emergencia.");
      return;
    }

    setError(null);
    router.push(`/emergencia/${encodeURIComponent(id)}`);
  }

  return (
    <Card>
      <span className="eyebrow">Ciudadano</span>
      <h3 className="font-semibold mt-2 mb-1">Consultar una emergencia</h3>
      <p className="text-sm text-text-secondary mb-4">
        Revisa el estado de tu solicitud con el identificador que recibiste.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="emergency-id" className="sr-only">
          Identificador de la emergencia
        </label>
        <input
          id="emergency-id"
          value={emergencyId}
          onChange={(event) => setEmergencyId(event.target.value)}
          placeholder="Ej. EMG-2026-0001"
          autoComplete="off"
          className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-sm data-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
        />
        <button type="submit" className="text-sm text-accent text-left hover:underline">
          Consultar estado →
        </button>
      </form>
      {error && (
        <p className="text-xs mt-2" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </Card>
  );
}