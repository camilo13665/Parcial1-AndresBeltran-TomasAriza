interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  accentColor?: string;
}

/** Tarjeta grande y táctil — pensada para un ciudadano bajo estrés: un solo toque, sin ambigüedad. */
export function SelectCard({ selected, onClick, title, subtitle, accentColor }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-ring text-left rounded-lg border p-4 transition-colors"
      style={{
        borderColor: selected ? (accentColor ?? "var(--accent)") : "var(--border)",
        background: selected ? (accentColor ? `${accentColor}14` : "var(--accent-soft)") : "var(--surface)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: selected ? (accentColor ?? "var(--accent)") : "var(--border-strong)" }}
        />
        <div>
          <div className="font-medium text-text-primary">{title}</div>
          {subtitle && <div className="text-sm text-text-secondary mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </button>
  );
}
