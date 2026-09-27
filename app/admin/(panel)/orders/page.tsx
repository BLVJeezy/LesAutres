import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money } from "@/lib/catalog";
import { listOrders, orderNumbers, orderStatus } from "@/lib/shop";
import { STATUS_BADGE } from "./status";
import { OrderRow } from "./order-row";

const FILTERS = { all: "Alle", open: "Niet verzonden", shipped: "Verzonden", refunded: "Terugbetaald" } as const;
type Filter = keyof typeof FILTERS;

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const filter: Filter = raw && raw in FILTERS ? (raw as Filter) : "all";
  const orders = await listOrders();
  const numbers = orderNumbers(orders);
  const shown = filter === "all" ? orders : orders.filter((o) => orderStatus(o) === filter);

  return (
    <>
      <div className="admin-head">
        <h1>Bestellingen</h1>
      </div>
      <section className="admin-card">
        <div className="admin-filterbar">
          <nav className="admin-tabs" aria-label="Filter">
            {(Object.keys(FILTERS) as Filter[]).map((f) => (
              <Link
                key={f}
                href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
                aria-current={f === filter ? "page" : undefined}
              >
                {FILTERS[f]}
              </Link>
            ))}
          </nav>
        </div>
        {shown.length ? (
          <div className="admin-scroll">
            <table className="admin-table rows orders-rows">
              <thead>
                <tr>
                  <th>Bestelling</th>
                  <th>Datum</th>
                  <th>Klant</th>
                  <th className="num">Totaal</th>
                  <th>Betaling</th>
                  <th>Verzending</th>
                  <th className="num admin-hide-mobile">Artikelen</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => {
                  const status = orderStatus(o);
                  const [tone, label] = STATUS_BADGE[status];
                  return (
                    <OrderRow key={o.id} href={`/admin/orders/${o.id}`}>
                      <td className="strong c-num">#{numbers.get(o.id)}</td>
                      <td className="c-date">
                        {new Date(o.created * 1000).toLocaleString("nl-BE", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Europe/Brussels",
                        })}
                      </td>
                      <td className="c-cust">{o.name || o.email}</td>
                      <td className="num c-total">{money(o.total)}</td>
                      <td className="c-pay">
                        {status === "refunded" ? (
                          <span className="badge">Terugbetaald</span>
                        ) : (
                          <span className="badge">Betaald</span>
                        )}
                      </td>
                      <td className="c-ship">
                        <span className={`badge ${tone}`}>{label}</span>
                      </td>
                      <td className="num admin-hide-mobile">
                        {o.lines.reduce((n, l) => n + l[2], 0)}
                      </td>
                    </OrderRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">
            {orders.length ? "Geen bestellingen met deze status." : "Nog geen bestellingen. Ze verschijnen hier zodra iemand betaalt."}
          </p>
        )}
      </section>
    </>
  );
}
