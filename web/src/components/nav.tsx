import Link from "next/link";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Resumen" },
  { href: "/payments", label: "Pagos" },
  { href: "/accounts", label: "Cuentas" },
  { href: "/payees", label: "Beneficiarios" },
  { href: "/categories", label: "Categorías" },
];

export function Nav({ email }: { email: string | undefined }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-muted">{email}</span>
          <form action={logout}>
            <Button type="submit" variant="ghost">
              Salir
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
