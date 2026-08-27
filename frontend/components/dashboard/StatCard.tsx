import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="eyebrow">{label}</span>
      <span
        className="data-mono text-3xl font-semibold leading-none"
        style={{ color: color ?? "var(--text-primary)" }}
      >
        {value}
      </span>
    </Card>
  );
}
