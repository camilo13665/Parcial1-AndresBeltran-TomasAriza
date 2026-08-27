"use client";

import { useEffect } from "react";
import { ADMIN_SESSION_KEY } from "@/lib/admin-auth";

export function SessionReset({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }, []);

  return children;
}
