import { NavBar } from "@/components/ui/NavBar";
import { SystemStatusBar } from "@/components/dashboard/SystemStatusBar";
import { DashboardLoader } from "@/components/dashboard/DashboardLoader";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLogout } from "@/components/admin/AdminLogout";

export default function DashboardPage() {
  return (
    <>
      <NavBar />
      <SystemStatusBar />
      <AdminGuard>
        <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex flex-col gap-2">
          <span className="eyebrow">Centro de control</span>
          <div className="flex items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-semibold">Dashboard de emergencias</h1>
            <AdminLogout />
          </div>
          <DashboardLoader />
        </main>
      </AdminGuard>
    </>
  );
}
