"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Bestellingen" },
  { href: "/admin/products", label: "Producten" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav>
      {links.map((l) => {
        const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
      <a href="/" target="_blank" rel="noopener">Shop ↗</a>
    </nav>
  );
}
