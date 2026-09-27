import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money, totalStock, VAT_RATE } from "@/lib/catalog";
import { listProducts, stripe } from "@/lib/shop";

export default async function Products() {
  await requireAdmin();
  const products = stripe() ? await listProducts({ includeInactive: true }) : [];
  return (
    <>
      <div className="admin-head">
        <h1>Producten</h1>
        {stripe() && (
          <Link className="admin-btn" href="/admin/products/new">+ Nieuw product</Link>
        )}
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Product</th><th>Prijs</th><th>Kostprijs</th><th>Marge / stuk</th>
            <th>Voorraad</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const margin = Math.round(p.price / (1 + VAT_RATE)) - p.cost;
            return (
              <tr key={p.id} className={p.active ? "" : "muted"}>
                <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
                <td>{money(p.price)}</td>
                <td>{money(p.cost)}</td>
                <td>{money(margin)}</td>
                <td className={totalStock(p) <= 5 ? "low" : ""}>{totalStock(p)}</td>
                <td>{p.active ? "Online" : "Offline"}</td>
              </tr>
            );
          })}
          {!products.length && (
            <tr><td colSpan={6}>Nog geen producten. Maak je eerste product aan.</td></tr>
          )}
        </tbody>
      </table>
      <p className="admin-note">
        Marge per stuk = verkoopprijs excl. btw − kostprijs (vóór Stripe-kosten).
      </p>
    </>
  );
}
