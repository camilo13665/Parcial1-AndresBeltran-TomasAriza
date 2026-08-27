import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/** Panel base tipo "consola" — superficie elevada con borde fino, sin sombras pesadas. */
export function Card({ padded = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-lg ${padded ? "p-5" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
