"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/api/client";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function useAdminSession() {
  // null = todavía sin verificar contra el backend, false = sin token (ya
  // se sabe de una, no hace falta esperar a un efecto).
  const [isAdmin, setIsAdmin] = useState<boolean | null>(() =>
    typeof window !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) ? null : false,
  );

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) return;

    adminApi
      .session(token)
      .then(() => setIsAdmin(true))
      .catch(() => {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setIsAdmin(false);
      });
  }, []);

  return isAdmin;
}