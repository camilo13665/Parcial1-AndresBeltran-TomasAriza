"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi, ApiError } from "@/services/api/client";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function AdminAccess({ redirectPath = "/dashboard" }: { redirectPath?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (token) {
      router.replace(redirectPath);
      return;
    }
    setChecking(false);
  }, [redirectPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await adminApi.login(username.trim(), password);
      sessionStorage.setItem(ADMIN_SESSION_KEY, response.token);
      router.replace(redirectPath);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    }
  }

  if (checking) return null;

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <span className="eyebrow">Acceso restringido</span>
          <h1 className="text-2xl font-semibold mt-2">Centro de control</h1>
          <p className="text-sm text-text-secondary mt-2">Solo para administradores autorizados.</p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Usuario
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-md border border-border bg-surface-raised px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </label>
        {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
        <button type="submit" className="rounded-md bg-accent px-4 py-3 font-medium text-bg hover:opacity-90">
          Entrar al centro de control
        </button>
      </form>
    </main>
  );
}