import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { listOrders, stripe } from "@/lib/shop";
import { logoutAction } from "../actions";
import { NavLinks } from "./nav-links";

export const dynamic = "force-dynamic";

function Brand({ className }: { className: string }) {
  return (
    <Link href="/admin" className={`admin-brand ${className}`}>
      <span className="admin-brand-mark">LA</span>
      Les Autres
    </Link>
  );
}

export default async function Panel({ children }: { children: ReactNode }) {
  await requireAdmin();
  const openOrders = stripe()
    ? (await listOrders().catch(() => [])).filter((o) => !o.shippedAt && o.refunded < o.total)
        .length
    : 0;
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Brand className="" />
        <NavLinks openOrders={openOrders} />
      </aside>
      <div className="admin-body">
        <header className="admin-top">
          <Brand className="admin-top-brand" />
          <form action={logoutAction}>
            <button className="admin-link">Uitloggen</button>
          </form>
        </header>
        <main className="admin-main">
          {!stripe() && (
            <p className="admin-banner">
              Stripe is nog niet gekoppeld. Zet <code>STRIPE_SECRET_KEY</code> in
              Vercel om producten op te slaan en bestellingen te ontvangen.
            </p>
          )}
          {stripe() && !process.env.STRIPE_WEBHOOK_SECRET && (
            <p className="admin-banner">
              <code>STRIPE_WEBHOOK_SECRET</code> ontbreekt: de voorraad daalt niet
              automatisch na een bestelling.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
