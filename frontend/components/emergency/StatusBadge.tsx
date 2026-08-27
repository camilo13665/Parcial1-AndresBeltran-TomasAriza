import { EmergencyStatus } from "@/types";
import { STATUS_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";

const STATUS_COLOR: Record<EmergencyStatus, { color: string; soft: string }> = {
  [EmergencyStatus.RECIBIDA]: { color: "#97a3b8", soft: "#97a3b81a" },
  [EmergencyStatus.VALIDANDO]: { color: "#f2b705", soft: "#f2b7051a" },
  [EmergencyStatus.PRIORIZADA]: { color: "#4d8bfa", soft: "#4d8bfa1a" },
  [EmergencyStatus.ASIGNADA]: { color: "#2dd4cf", soft: "#2dd4cf1a" },
  [EmergencyStatus.EN_ATENCION]: { color: "#f7891a", soft: "#f7891a1a" },
  [EmergencyStatus.RESUELTA]: { color: "#2fbf71", soft: "#2fbf711a" },
  [EmergencyStatus.CANCELADA]: { color: "#5f6b81", soft: "#5f6b811a" },
};

export function StatusBadge({ status }: { status: EmergencyStatus }) {
  const { color, soft } = STATUS_COLOR[status];
  return (
    <Badge color={color} colorSoft={soft}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
