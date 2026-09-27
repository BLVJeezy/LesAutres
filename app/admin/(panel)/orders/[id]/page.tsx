import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { money } from "@/lib/catalog";
import { shippingLabel } from "@/lib/shipping";
import { adminProducts, listOrders, orderNumbers, orderStatus } from "@/lib/shop";
import { toggleRefundedAction, toggleShippedAction } from "../../../actions";
import { STATUS_BADGE } from "../status";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [orders, products] = await Promise.all([listOrders(), adminProducts()]);
  const order = orders.find((o) => o.id === id);
  if (!order) notFound();
  const number = orderNumbers(orders).get(order.id);
  const status = orderStatus(order);
  const [tone, label] = STATUS_BADGE[status];
  const product = (pid: string) => products.find((p) => p.id === pid);
  const date = new Date(order.created * 1000).toLocaleString("nl-BE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  });

  return (
    <>
      <div className="admin-head">
        <div className="admin-title-row">
          <Link href="/admin/orders" className="admin-back" aria-label="Terug naar bestellingen">
            <ArrowLeft size={18} />
          </Link>
          <h1>#{number}</h1>
          <span className="badge">{status === "refunded" ? "Terugbetaald" : "Betaald"}</span>
          <span className={`badge ${tone}`}>{label}</span>
        </div>
        <span className="admin-note">{date}</span>
      </div>

      <div className="admin-grid-2">
        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card-head">
              <span className={`badge ${tone}`}>{label}</span>
            </div>
            <div className="admin-card-body">
              <ul className="admin-lines">
                {order.lines.map(([pid, size, qty, unitPrice]) => {
                  const p = product(pid);
                  return (
                    <li key={`${pid}-${size}`}>
                      {p?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" width={48} height={48} style={{ borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />
                      ) : null}
                      <div className="grow">
                        <b>{p?.name ?? "Verwijderd product"}</b>
                        <div className="admin-note">Maat {size}</div>
                      </div>
                      <span className="admin-muted">
                        {money(unitPrice)} × {qty}
                      </span>
                      <b>{money(unitPrice * qty)}</b>
                    </li>
                  );
                })}
              </ul>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <form action={toggleRefundedAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="refunded" value={status === "refunded" ? "0" : "1"} />
                  <button className="admin-btn secondary">
                    {status === "refunded" ? "Terugbetaling ongedaan maken" : "Markeer als terugbetaald"}
                  </button>
                </form>
                {status !== "refunded" && (
                  <form action={toggleShippedAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="shipped" value={order.shippedAt ? "0" : "1"} />
                    <button className={`admin-btn ${order.shippedAt ? "secondary" : ""}`}>
                      {order.shippedAt ? "Markeer als niet verzonden" : "Markeer als verzonden"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <span className="badge">{status === "refunded" ? "Terugbetaald" : "Betaald"}</span>
            </div>
            <div className="admin-card-body">
              <dl className="admin-summary">
                <dt>Subtotaal</dt>
                <dd>{money(order.total - order.shippingFee)}</dd>
                <dt>Verzending ({shippingLabel(order.shippingMethod)})</dt>
                <dd>{order.shippingFee ? money(order.shippingFee) : "Gratis"}</dd>
                {order.refunded > 0 && (
                  <>
                    <dt>Terugbetaald</dt>
                    <dd>−{money(order.refunded)}</dd>
                  </>
                )}
                <dt className="total">Betaald door klant</dt>
                <dd className="total">{money(order.total - order.refunded)}</dd>
                <dt>Btw (inbegrepen)</dt>
                <dd>{money(order.vat)}</dd>
                <dt>Kostprijs</dt>
                <dd>−{money(order.cost)}</dd>
                <dt className="total">Winst</dt>
                <dd className="total">{money(order.profit)}</dd>
              </dl>
            </div>
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Klant</h2>
            </div>
            <div className="admin-card-body admin-stack" style={{ gap: 12 }}>
              <div>
                <b>{order.name || "—"}</b>
              </div>
              <div>
                <div className="admin-note">Contact</div>
                {order.email ? <a href={`mailto:${order.email}`}>{order.email}</a> : "—"}
              </div>
              <div>
                <div className="admin-note">Verzendadres</div>
                {order.address || "—"}
              </div>
            </div>
          </section>
          {order.shippedAt && (
            <section className="admin-card">
              <div className="admin-card-body">
                <div className="admin-note">Verzonden op</div>
                {new Date(order.shippedAt * 1000).toLocaleString("nl-BE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Europe/Brussels",
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
