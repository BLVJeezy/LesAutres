import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { firebaseConfigured } from "@/lib/firebase";
import { revolutConfigured } from "@/lib/revolut";
import { listOrders } from "@/lib/shop";
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
  const openOrders = firebaseConfigured()
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
          {!firebaseConfigured() && (
            <p className="admin-banner">
              Firebase is nog niet gekoppeld. Zet <code>FIREBASE_SERVICE_ACCOUNT</code> in
              Vercel om producten en foto&apos;s op te slaan.
            </p>
          )}
          {!revolutConfigured() && (
            <p className="admin-banner">
              Revolut is nog niet gekoppeld. Zet <code>REVOLUT_SECRET_KEY</code> in
              Vercel om betalingen en bestellingen te ontvangen.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
