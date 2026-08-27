import { EmergencyStatus } from "@/types";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/constants";

export function StatusTimeline({ status }: { status: EmergencyStatus }) {
  if (status === EmergencyStatus.CANCELADA) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full" style={{ background: "var(--text-muted)" }} />
        <span className="text-text-secondary">Emergencia cancelada</span>
      </div>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(status);

  return (
    <div className="flex items-center w-full overflow-x-auto">
      {STATUS_FLOW.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const color = isDone || isCurrent ? "var(--accent)" : "var(--border-strong)";

        return (
          <div key={step} className="flex items-center flex-1 min-w-[100px] last:flex-none last:min-w-0">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <span
                className="w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: color,
                  background: isDone || isCurrent ? color : "transparent",
                }}
              />
              <span
                className="text-[11px] text-center whitespace-nowrap"
                style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-muted)" }}
              >
                {STATUS_LABEL[step]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div
                className="h-px flex-1 mx-2 -mt-5"
                style={{ background: isDone ? "var(--accent)" : "var(--border)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
