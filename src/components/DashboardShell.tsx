import Link from "next/link";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string };

/**
 * Sidebar + content frame shared by the buyer, seller and admin areas. A server component: the
 * links are plain anchors, and sign-out is a form POST, so it needs no client JavaScript at all.
 */
export function DashboardShell({
  title,
  name,
  nav,
  children,
}: {
  title: string;
  name: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link href="/" className="text-lg font-bold">Kasafide</Link>
        <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">{title}</p>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm hover:bg-surface-soft">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border pt-4 text-sm">
          <p className="truncate font-medium">{name}</p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="mt-2 text-xs text-text-muted underline hover:text-text">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <nav className="mb-4 flex flex-wrap gap-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full border border-border px-3 py-1 text-xs">{n.label}</Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}
