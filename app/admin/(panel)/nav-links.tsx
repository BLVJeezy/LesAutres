"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Home, Inbox, Mail, ShoppingCart, Tag } from "lucide-react";

export function NavLinks({ openOrders }: { openOrders: number }) {
  const path = usePathname();
  const links = [
    { href: "/admin", label: "Home", icon: Home },
    { href: "/admin/orders", label: "Bestellingen", icon: Inbox, count: openOrders },
    { href: "/admin/checkouts", label: "Verlaten checkouts", icon: ShoppingCart },
    { href: "/admin/products", label: "Producten", icon: Tag },
    { href: "/admin/subscribers", label: "Inschrijvingen", icon: Mail },
  ];
  return (
    <nav aria-label="Admin">
      {links.map(({ href, label, icon: Icon, count }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            <Icon size={18} strokeWidth={2} />
            {label}
            {count ? <span className="nav-count">{count}</span> : null}
          </Link>
        );
      })}
      <a href="/" target="_blank" rel="noopener">
        <ExternalLink size={18} strokeWidth={2} />
        Shop
      </a>
    </nav>
  );
}
