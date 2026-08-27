"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/api/client";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) {
      setIsAdmin(false);
      return;
    }

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