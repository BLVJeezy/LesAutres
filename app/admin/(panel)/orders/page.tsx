import { requireAdmin } from "@/lib/admin-auth";
import { money } from "@/lib/catalog";
import { adminProducts, listOrders } from "@/lib/shop";
import { toggleShippedAction } from "../../actions";

export default async function Orders() {
  await requireAdmin();
  const [orders, products] = await Promise.all([
    listOrders(),
    adminProducts(),
  ]);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <div className="admin-head">
        <h1>Bestellingen</h1>
        <span className="admin-note">{orders.length} betaald</span>
      </div>
      <div className="admin-orders">
        {orders.map((o) => {
          const refunded = o.refunded >= o.total;
          return (
            <article key={o.id} className="admin-order">
              <header>
                <b>{new Date(o.created * 1000).toLocaleString("nl-BE")}</b>
                <span className={`admin-status ${refunded ? "refunded" : o.shippedAt ? "shipped" : "open"}`}>
                  {refunded ? "Terugbetaald" : o.shippedAt ? "Verzonden" : "Te verzenden"}
                </span>
              </header>
              <div className="admin-order-body">
                <div>
                  <p><b>{o.name}</b></p>
                  <p>{o.email}</p>
                  <p>{o.address}</p>
                </div>
                <ul>
                  {o.lines.map(([id, size, qty, unitPrice]) => (
                    <li key={`${id}-${size}`}>
                      {qty} × {name(id)} — {size} <span>{money(qty * unitPrice)}</span>
                    </li>
                  ))}
                </ul>
                <dl>
                  <dt>Totaal</dt><dd>{money(o.total)}</dd>
                  {o.refunded > 0 && (<><dt>Terugbetaald</dt><dd>−{money(o.refunded)}</dd></>)}
                  <dt>Btw</dt><dd>{money(o.vat)}</dd>
                  <dt>Stripe</dt><dd>{money(o.fee)}</dd>
                  <dt>Kostprijs</dt><dd>{money(o.cost)}</dd>
                  <dt>Winst</dt><dd><b>{money(o.profit)}</b></dd>
                </dl>
              </div>
              {o.paymentIntent && !refunded && (
                <form action={toggleShippedAction}>
                  <input type="hidden" name="paymentIntent" value={o.paymentIntent} />
                  <input type="hidden" name="shipped" value={o.shippedAt ? "0" : "1"} />
                  <button className="admin-btn small">
                    {o.shippedAt ? "Markeer als niet verzonden" : "Markeer als verzonden"}
                  </button>
                </form>
              )}
            </article>
          );
        })}
        {!orders.length && <p>Nog geen bestellingen.</p>}
      </div>
    </>
  );
}
