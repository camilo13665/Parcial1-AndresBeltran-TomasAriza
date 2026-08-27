import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  colorSoft?: string;
  dot?: boolean;
}

/** Etiqueta base tipo "tag de triage" — punto de color + texto, borde sutil. */
export function Badge({ color, colorSoft, dot = true, className = "", style, children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
      style={{
        color: color ?? "var(--text-secondary)",
        background: colorSoft ?? "var(--surface-raised)",
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: color ?? "var(--text-secondary)" }}
        />
      )}
      {children}
    </span>
  );
}
