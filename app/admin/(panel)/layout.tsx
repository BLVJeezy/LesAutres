import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { stripe } from "@/lib/shop";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Panel({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="admin-nav">
        <b>LES AUTRES</b>
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/orders">Bestellingen</Link>
          <Link href="/admin/products">Producten</Link>
          <a href="/" target="_blank" rel="noopener">Shop ↗</a>
        </nav>
        <form action={logoutAction}>
          <button className="admin-link">Uitloggen</button>
        </form>
      </header>
      {!stripe() && (
        <p className="admin-alert admin-banner">
          Stripe is niet gekoppeld: zet <code>STRIPE_SECRET_KEY</code> in Vercel.
          Tot dan zijn er geen bestellingen of producten.
        </p>
      )}
      {stripe() && !process.env.STRIPE_WEBHOOK_SECRET && (
        <p className="admin-alert admin-banner">
          <code>STRIPE_WEBHOOK_SECRET</code> ontbreekt: voorraad daalt niet
          automatisch na een bestelling.
        </p>
      )}
      <main className="admin-main">{children}</main>
    </>
  );
}
