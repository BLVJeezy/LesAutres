import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money, totalStock, VAT_RATE } from "@/lib/catalog";
import { adminProducts, stripe } from "@/lib/shop";

export default async function Products() {
  await requireAdmin();
  const connected = Boolean(stripe());
  const products = await adminProducts();
  return (
    <>
      <div className="admin-head">
        <h1>Producten</h1>
        {connected && (
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
                <td>{p.cost ? money(p.cost) : "—"}</td>
                <td>{p.cost ? money(margin) : "—"}</td>
                <td className={totalStock(p) <= 5 ? "low" : ""}>{totalStock(p)}</td>
                <td>
                  {!connected
                    ? "Concept — wacht op Stripe"
                    : p.active
                      ? "Online"
                      : "Offline — vul kostprijs en voorraad in"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="admin-note">
        Marge per stuk = verkoopprijs excl. btw − kostprijs (vóór Stripe-kosten).
      </p>
    </>
  );
}
