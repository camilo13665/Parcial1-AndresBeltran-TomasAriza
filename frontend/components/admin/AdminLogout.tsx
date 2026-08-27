"use client";

import { useRouter } from "next/navigation";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function AdminLogout() {
  const router = useRouter();

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    router.replace("/admin");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-text-secondary hover:text-text-primary underline underline-offset-4"
    >
      Cerrar sesión
    </button>
  );
}