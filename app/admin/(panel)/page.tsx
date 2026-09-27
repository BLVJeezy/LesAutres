import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money, sizes, totalStock, VAT_RATE } from "@/lib/catalog";
import { adminProducts, listOrders } from "@/lib/shop";

const PERIODS = { "7": "7 dagen", "30": "30 dagen", "90": "90 dagen", all: "Alles" } as const;
type Period = keyof typeof PERIODS;

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdmin();
  const { period: raw } = await searchParams;
  const period: Period = raw && raw in PERIODS ? (raw as Period) : "30";
  const since =
    period === "all" ? undefined : Math.floor(Date.now() / 1000) - Number(period) * 86400;
  const [orders, products] = await Promise.all([
    listOrders(since),
    adminProducts(),
  ]);

  const sum = (f: (o: (typeof orders)[number]) => number) => orders.reduce((n, o) => n + f(o), 0);
  const revenue = sum((o) => o.total - o.refunded);
  const vat = sum((o) => o.vat);
  const fees = sum((o) => o.fee);
  const cogs = sum((o) => o.cost);
  const profit = sum((o) => o.profit);
  const net = revenue - vat;
  const units = sum((o) => o.lines.reduce((n, l) => n + l[2], 0));
  const toShip = orders.filter((o) => !o.shippedAt && o.refunded < o.total).length;

  const perProduct = new Map<string, { units: number; revenue: number; cost: number }>();
  for (const o of orders)
    for (const [id, , qty, unitPrice, unitCost] of o.lines) {
      const row = perProduct.get(id) ?? { units: 0, revenue: 0, cost: 0 };
      row.units += qty;
      row.revenue += qty * unitPrice;
      row.cost += qty * unitCost;
      perProduct.set(id, row);
    }
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  const kpis = [
    ["Omzet (incl. btw)", money(revenue)],
    ["Btw (21%)", money(vat)],
    ["Stripe-kosten", money(fees)],
    ["Kostprijs goederen", money(cogs)],
    ["Winst", money(profit)],
    ["Marge", net > 0 ? `${Math.round((profit / net) * 100)}%` : "—"],
    ["Bestellingen", String(orders.length)],
    ["Stuks verkocht", String(units)],
    ["Gem. bestelling", orders.length ? money(Math.round(revenue / orders.length)) : "—"],
    ["Te verzenden", String(toShip)],
  ];

  return (
    <>
      <div className="admin-head">
        <h1>Dashboard</h1>
        <nav className="admin-tabs">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <Link key={p} href={`/admin?period=${p}`} aria-current={p === period ? "page" : undefined}>
              {PERIODS[p]}
            </Link>
          ))}
        </nav>
      </div>
      <section className="admin-kpis">
        {kpis.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </section>
      <p className="admin-note">
        Winst = omzet − btw − Stripe-kosten − kostprijs. Terugbetalingen zijn
        afgetrokken. Btw gerekend aan {VAT_RATE * 100}%.
      </p>

      <h2>Per product</h2>
      <table className="admin-table stack">
        <thead>
          <tr><th>Product</th><th>Stuks</th><th>Omzet</th><th>Kostprijs</th><th>Brutomarge</th></tr>
        </thead>
        <tbody>
          {[...perProduct].map(([id, r]) => (
            <tr key={id}>
              <td className="stack-title">{name(id)}</td>
              <td data-label="Stuks">{r.units}</td>
              <td data-label="Omzet">{money(r.revenue)}</td>
              <td data-label="Kostprijs">{money(r.cost)}</td>
              <td data-label="Brutomarge">{money(Math.round(r.revenue / (1 + VAT_RATE)) - r.cost)}</td>
            </tr>
          ))}
          {!perProduct.size && (
            <tr><td colSpan={5}>Nog geen verkopen in deze periode.</td></tr>
          )}
        </tbody>
      </table>

      <h2>Voorraad</h2>
      <table className="admin-table">
        <thead>
          <tr><th>Product</th>{sizes.map((s) => <th key={s}>{s}</th>)}<th>Totaal</th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.active ? "" : "muted"}>
              <td><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
              {sizes.map((s) => (
                <td key={s} className={p.stock[s] <= 2 ? "low" : ""}>{p.stock[s]}</td>
              ))}
              <td>{totalStock(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-head">
        <h2>Laatste bestellingen</h2>
        <Link href="/admin/orders">Alle bestellingen →</Link>
      </div>
      <table className="admin-table stack">
        <thead>
          <tr><th>Datum</th><th>Klant</th><th>Totaal</th><th>Winst</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.slice(0, 8).map((o) => (
            <tr key={o.id}>
              <td data-label="Datum">{new Date(o.created * 1000).toLocaleString("nl-BE")}</td>
              <td className="stack-title">{o.name || o.email}</td>
              <td data-label="Totaal">{money(o.total)}</td>
              <td data-label="Winst">{money(o.profit)}</td>
              <td data-label="Status">{o.refunded >= o.total ? "Terugbetaald" : o.shippedAt ? "Verzonden" : "Te verzenden"}</td>
            </tr>
          ))}
          {!orders.length && <tr><td colSpan={5}>Nog geen bestellingen.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
