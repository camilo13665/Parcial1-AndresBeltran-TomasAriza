import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionReset } from "@/components/admin/SessionReset";

export const metadata: Metadata = {
  title: "Gestión de Emergencias",
  description:
    "Plataforma de recepción, clasificación, asignación y monitoreo de emergencias — Chocó, Pereira, Cali, Manizales.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0f1a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        <SessionReset>{children}</SessionReset>
      </body>
    </html>
  );
}
