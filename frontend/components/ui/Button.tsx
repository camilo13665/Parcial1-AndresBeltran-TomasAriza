import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:opacity-90 border border-transparent",
  secondary: "bg-transparent text-text-primary border border-border-strong hover:border-accent hover:text-accent",
  ghost: "bg-transparent text-text-secondary hover:text-text-primary border border-transparent",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-4 text-base",
};

const BASE = "focus-ring inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none";

export const Button = forwardRef<HTMLButtonElement, BaseProps & ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";

interface LinkButtonProps extends BaseProps {
  href: string;
  children: React.ReactNode;
}

/** Botón que navega, usado para las llamadas a la acción principales (Home). */
export function LinkButton({ href, variant = "primary", size = "md", className = "", children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
