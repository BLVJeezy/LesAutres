import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money, sizes, totalStock, VAT_RATE } from "@/lib/catalog";
import { adminProducts, listOrders, orderNumbers, orderStatus } from "@/lib/shop";
import { SalesChart, type Day } from "./sales-chart";

const PERIODS = { "7": "7 dagen", "30": "30 dagen", "90": "90 dagen", all: "Alles" } as const;
type Period = keyof typeof PERIODS;
const TZ = "Europe/Brussels";
const dayKey = (unix: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(unix * 1000));
const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${key}T00:00:00Z`),
  );

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const { period: raw } = await searchParams;
  const period: Period = raw && raw in PERIODS ? (raw as Period) : "30";
  const now = Math.floor(Date.now() / 1000);
  const since = period === "all" ? undefined : now - Number(period) * 86400;
  const [allOrders, products] = await Promise.all([listOrders(), adminProducts()]);
  const orders = since ? allOrders.filter((o) => o.created >= since) : allOrders;
  const numbers = orderNumbers(allOrders);

  const sum = (f: (o: (typeof orders)[number]) => number) => orders.reduce((n, o) => n + f(o), 0);
  const revenue = sum((o) => o.total - o.refunded);
  const vat = sum((o) => o.vat);
  const cogs = sum((o) => o.cost);
  const profit = sum((o) => o.profit);
  const net = revenue - vat;
  const units = sum((o) => o.lines.reduce((n, l) => n + l[2], 0));
  const open = allOrders.filter((o) => orderStatus(o) === "open");

  const spanDays =
    period === "all"
      ? Math.min(365, Math.max(7, Math.ceil((now - Math.min(now, ...orders.map((o) => o.created))) / 86400) + 1))
      : Number(period);
  const buckets = new Map<string, Day>();
  for (let i = spanDays - 1; i >= 0; i--) {
    const key = dayKey(now - i * 86400);
    buckets.set(key, { date: key, label: dayLabel(key), revenue: 0, orders: 0 });
  }
  for (const o of orders) {
    const b = buckets.get(dayKey(o.created));
    if (b) {
      b.revenue += o.total - o.refunded;
      b.orders += 1;
    }
  }

  const perProduct = new Map<string, { units: number; revenue: number; cost: number }>();
  for (const o of orders)
    for (const [id, , qty, unitPrice, unitCost] of o.lines) {
      const row = perProduct.get(id) ?? { units: 0, revenue: 0, cost: 0 };
      row.units += qty;
      row.revenue += qty * unitPrice;
      row.cost += qty * unitCost;
      perProduct.set(id, row);
    }
  const productOf = (id: string) => products.find((p) => p.id === id);
  const lowStock = products
    .flatMap((p) => sizes.filter((s) => p.active && p.stock[s] <= 2).map((s) => ({ p, s })))
    .slice(0, 8);

  const kpis: [string, string, string?][] = [
    ["Omzet", money(revenue), "incl. btw"],
    ["Bestellingen", String(orders.length), `${units} stuks`],
    ["Winst", money(profit), net > 0 ? `${Math.round((profit / net) * 100)}% marge` : undefined],
    ["Gem. bestelling", orders.length ? money(Math.round(revenue / orders.length)) : "—"],
    ["Btw", money(vat), `${VAT_RATE * 100}%`],
    ["Terugbetaald", money(orders.reduce((n, o) => n + o.refunded, 0))],
    ["Kostprijs goederen", money(cogs)],
    ["Te verzenden", String(open.length), "alle periodes"],
  ];

  return (
    <>
      <div className="admin-head">
        <h1>Home</h1>
        <nav className="admin-tabs" aria-label="Periode">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <Link key={p} href={`/admin?period=${p}`} aria-current={p === period ? "page" : undefined}>
              {PERIODS[p]}
            </Link>
          ))}
        </nav>
      </div>

      <section className="admin-card">
        <div className="admin-kpis">
          {kpis.map(([label, value, sub]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
              {sub && <small>{sub}</small>}
            </div>
          ))}
        </div>
        <div className="admin-card-body">
          <h2 style={{ marginBottom: 8 }}>Omzet per dag</h2>
          <SalesChart days={[...buckets.values()]} />
        </div>
      </section>

      <div className="admin-grid-2">
        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Te verzenden</h2>
              <Link href="/admin/orders?status=open" className="admin-link">Alle →</Link>
            </div>
            <div className="admin-card-body">
              {open.length ? (
                <ul className="admin-lines">
                  {open.slice(0, 5).map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders/${o.id}`} className="grow" style={{ textDecoration: "none" }}>
                        <b>#{numbers.get(o.id)}</b> · {o.name || o.email}
                        <div className="admin-note">
                          {new Date(o.created * 1000).toLocaleDateString("nl-BE", { timeZone: TZ })}
                        </div>
                      </Link>
                      <span className="badge attention">Niet verzonden</span>
                      <b>{money(o.total)}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-note">Alles is verzonden.</p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Verkopen per product</h2>
            </div>
            <div className="admin-card-body">
              {perProduct.size ? (
                <ul className="admin-lines">
                  {[...perProduct]
                    .sort((a, b) => b[1].revenue - a[1].revenue)
                    .map(([id, r]) => {
                      const p = productOf(id);
                      return (
                        <li key={id}>
                          {p?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} />
                          ) : null}
                          <div className="grow">
                            <b>{p?.name ?? "Verwijderd product"}</b>
                            <div className="admin-note">
                              {r.units} verkocht · marge {money(Math.round(r.revenue / (1 + VAT_RATE)) - r.cost)}
                            </div>
                          </div>
                          <b>{money(r.revenue)}</b>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="admin-note">Nog geen verkopen in deze periode.</p>
              )}
            </div>
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Lage voorraad</h2>
            </div>
            <div className="admin-card-body">
              {lowStock.length ? (
                <ul className="admin-lines">
                  {lowStock.map(({ p, s }) => (
                    <li key={`${p.id}-${s}`}>
                      <span className="grow">
                        {p.name} — <b>{s}</b>
                      </span>
                      <span className={`badge ${p.stock[s] === 0 ? "critical" : "attention"}`}>
                        {p.stock[s] === 0 ? "Uitverkocht" : `${p.stock[s]} over`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-note">Alle maten zijn op voorraad.</p>
              )}
            </div>
          </section>
          <section className="admin-card">
            <div className="admin-card-head">
              <h2>Producten</h2>
              <Link href="/admin/products" className="admin-link">Beheren →</Link>
            </div>
            <div className="admin-card-body">
              <dl className="admin-summary">
                <dt>Online</dt>
                <dd>{products.filter((p) => p.active).length}</dd>
                <dt>Offline / concept</dt>
                <dd>{products.filter((p) => !p.active).length}</dd>
                <dt>Stuks op voorraad</dt>
                <dd>{products.reduce((n, p) => n + totalStock(p), 0)}</dd>
              </dl>
            </div>
          </section>
          <p className="admin-note">
            Winst = omzet − btw − kostprijs; terugbetalingen afgetrokken.
          </p>
        </div>
      </div>
    </>
  );
}
