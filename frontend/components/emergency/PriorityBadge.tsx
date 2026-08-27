import { EmergencyPriority } from "@/types";
import { PRIORITY_META } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

export function PriorityBadge({ priority, compact = false }: { priority: EmergencyPriority; compact?: boolean }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge color={meta.colorVar} colorSoft={meta.colorSoftVar}>
      {compact ? meta.shortLabel : meta.label}
    </Badge>
  );
}
