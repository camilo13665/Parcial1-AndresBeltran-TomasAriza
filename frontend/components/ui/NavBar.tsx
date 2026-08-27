import Link from "next/link";

const NAV_LINKS = [
  { href: "/reportar", label: "Reportar" },
];

export function NavBar() {
  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 focus-ring rounded">
          <span
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: "var(--accent)" }}
            aria-hidden
          />
          <span className="font-semibold tracking-tight text-text-primary">
            Gestión de Emergencias
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
