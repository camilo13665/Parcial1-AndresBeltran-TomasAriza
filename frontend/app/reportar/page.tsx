import { NavBar } from "@/components/ui/NavBar";
import { ReportForm } from "@/components/emergency/ReportForm";

export default function ReportarPage() {
  return (
    <>
      <NavBar />
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 sm:px-6 py-10 flex flex-col gap-2">
        <span className="eyebrow">Reportar</span>
        <h1 className="text-2xl font-semibold mb-6">¿Qué está pasando?</h1>
        <ReportForm />
      </main>
    </>
  );
}
