"use client";

import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";
import { AdminAccess } from "@/components/admin/AdminAccess";
import { adminApi } from "@/services/api/client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!token) {
      return;
    }
    adminApi.session(token).then(() => setAuthorized(true)).catch(() => sessionStorage.removeItem(ADMIN_SESSION_KEY));
  }, []);

  if (!authorized) return <AdminAccess redirectPath="/dashboard" />;
  return children;
}