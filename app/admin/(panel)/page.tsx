import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { money, sizes, totalStock, VAT_RATE } from "@/lib/catalog";
import { adminProducts, listOrders, orderNumbers, orderStatus } from "@/lib/shop";
import { demoOrders } from "@/lib/demo";
import { funnel } from "@/lib/analytics";
import { UNLIMITED_STOCK } from "@/lib/bundles";
import { SalesChart, type Day } from "./sales-chart";

const PERIODS = { today: "Vandaag", "48h": "48 uur", "7": "7 dagen", "30": "30 dagen", "90": "90 dagen", all: "Alles" } as const;
type Period = keyof typeof PERIODS;
const PERIOD_ORDER: Period[] = ["today", "48h", "7", "30", "90", "all"];
const TZ = "Europe/Brussels";
const dayKey = (unix: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(unix * 1000));
const hourKey = (unix: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).format(new Date(unix * 1000));
const hourLabel = (unix: number) =>
  `${new Intl.DateTimeFormat("nl-BE", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date(unix * 1000))}u`;
/** Unix time of 00:00 Brussels on the given YYYY-MM-DD. */
function midnight(key: string) {
  const utc = Date.parse(`${key}T00:00:00Z`);
  const d = new Date(utc);
  const offset =
    Date.parse(d.toLocaleString("en-US", { timeZone: TZ })) - Date.parse(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.floor((utc - offset) / 1000);
}
const isDate = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("nl-BE", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${key}T00:00:00Z`),
  );

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; demo?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const { period: raw, demo: demoParam, from: rawFrom, to: rawTo } = await searchParams;
  const demo = demoParam === "1";
  const now = Math.floor(Date.now() / 1000);
  const custom = raw === "custom" && isDate(rawFrom) && isDate(rawTo);
  const period: Period | "custom" = custom ? "custom" : raw && raw in PERIODS ? (raw as Period) : "30";
  const [fromKey, toKey] = custom ? [rawFrom!, rawTo!].sort() : [dayKey(now - 29 * 86400), dayKey(now)];
  const since =
    period === "custom"
      ? midnight(fromKey)
      : period === "all"
        ? undefined
        : period === "today"
          ? midnight(dayKey(now))
          : period === "48h"
            ? now - 48 * 3600
            : now - Number(period) * 86400;
  const until = period === "custom" ? midnight(toKey) + 86400 : now + 1;
  const extra = demo ? "&demo=1" : "";
  const [realOrders, products] = await Promise.all([listOrders(), adminProducts()]);
  const allOrders = demo
    ? demoOrders(products[0]?.id ?? "baddies-tee", products[0]?.price || 4495, products[0]?.cost || 900, now)
    : realOrders.filter((o) => !o.test);
  const orders = allOrders.filter((o) => (since === undefined || o.created >= since) && o.created < until);
  const numbers = orderNumbers(allOrders);

  const sum = (f: (o: (typeof orders)[number]) => number) => orders.reduce((n, o) => n + f(o), 0);
  const revenue = sum((o) => o.total - o.refunded);
  const vat = sum((o) => o.vat);
  const cogs = sum((o) => o.cost);
  const profit = sum((o) => o.profit);
  const net = revenue - vat;
  const units = sum((o) => o.lines.reduce((n, l) => n + l[2], 0));
  const open = allOrders.filter((o) => orderStatus(o) === "open");

  const buckets = new Map<string, Day>();
  const hourly = period === "today" || period === "48h" || (period === "custom" && fromKey === toKey);
  if (hourly) {
    const start = since ?? now;
    const stop = period === "48h" ? now + 1 : start + 86400;
    for (let t = start - (start % 3600); t < stop; t += 3600)
      buckets.set(hourKey(t), { date: hourKey(t), label: hourLabel(t), revenue: 0, orders: 0 });
  } else {
    const end = Math.min(until - 1, now);
    const first =
      since ?? Math.max(end - 364 * 86400, Math.min(end - 6 * 86400, ...orders.map((o) => o.created)));
    const spanDays = Math.min(366, Math.floor((midnight(dayKey(end)) - midnight(dayKey(first))) / 86400) + 1);
    for (let i = spanDays - 1; i >= 0; i--) {
      const key = dayKey(end - i * 86400);
      buckets.set(key, { date: key, label: dayLabel(key), revenue: 0, orders: 0 });
    }
  }
  for (const o of orders) {
    const b = buckets.get(hourly ? hourKey(o.created) : dayKey(o.created));
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
  const lowStock = UNLIMITED_STOCK ? [] : products
    .flatMap((p) => sizes.filter((s) => p.active && p.stock[s] <= 2).map((s) => ({ p, s })))
    .slice(0, 8);

  const funnelFrom = since === undefined ? "2000-01-01" : dayKey(since);
  const funnelTo = dayKey(Math.min(until - 1, now));
  const counts = demo
    ? {
        page_view: orders.length * 41,
        view_product: orders.length * 29,
        add_to_cart: orders.length * 6,
        begin_checkout: Math.round(orders.length * 2.3),
      }
    : await funnel(funnelFrom, funnelTo).catch(() => null);
  const steps: [string, number][] = counts
    ? [
        ["Bezoekers", counts.page_view],
        ["Product bekeken", counts.view_product],
        ["In winkelmand", counts.add_to_cart],
        ["Naar checkout", counts.begin_checkout],
        ["Betaald", orders.length],
      ]
    : [];
  const kpis: [string, string, string?][] = [
    ["Omzet", money(revenue), VAT_RATE ? "incl. btw" : "geen btw"],
    ["Bestellingen", String(orders.length), `${units} stuks`],
    ["Winst", money(profit), net > 0 ? `${Math.round((profit / net) * 100)}% marge` : undefined],
    ["Gem. bestelling", orders.length ? money(Math.round(revenue / orders.length)) : "—"],
    ...(VAT_RATE ? [["Btw", money(vat), `${VAT_RATE * 100}%`] as [string, string, string]] : []),
    ["Terugbetaald", money(orders.reduce((n, o) => n + o.refunded, 0))],
    ["Kostprijs goederen", money(cogs)],
    ["Te verzenden", String(open.length), "alle periodes"],
  ];

  return (
    <>
      <div className="admin-head">
        <h1>Home {demo && <span className="badge attention">TESTMODUS</span>}</h1>
        <nav className="admin-tabs" aria-label="Periode">
          {PERIOD_ORDER.map((p) => (
            <Link key={p} href={`/admin?period=${p}${extra}`} aria-current={p === period ? "page" : undefined}>
              {PERIODS[p]}
            </Link>
          ))}
        </nav>
        <form className="admin-daterange" action="/admin">
          <input type="hidden" name="period" value="custom" />
          {demo && <input type="hidden" name="demo" value="1" />}
          <input type="date" name="from" defaultValue={fromKey} max={dayKey(now)} aria-label="Van" required />
          <span>–</span>
          <input type="date" name="to" defaultValue={period === "custom" ? toKey : dayKey(now)} max={dayKey(now)} aria-label="Tot en met" required />
          <button className={`admin-btn ${period === "custom" ? "" : "secondary"}`}>Toepassen</button>
        </form>
      </div>

      <p className={demo ? "admin-banner" : "admin-note"}>
        {demo ? (
          <>
            Testmodus: voorbeeldcijfers van een webshop met gemiddeld € 10k–30k winst per maand. Dit zijn géén
            echte bestellingen. <Link href={`/admin?period=${period}${period === "custom" ? `&from=${fromKey}&to=${toKey}` : ""}`}>Terug naar echte cijfers →</Link>
          </>
        ) : (
          <Link href={`/admin?period=${period}${period === "custom" ? `&from=${fromKey}&to=${toKey}` : ""}&demo=1`}>Testmodus aanzetten →</Link>
        )}
      </p>

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
          <h2 style={{ marginBottom: 8 }}>{hourly ? "Omzet per uur" : "Omzet per dag"}</h2>
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
                      <Link href={demo ? `/admin?period=${period}&demo=1` : `/admin/orders/${o.id}`} className="grow" style={{ textDecoration: "none" }}>
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
              <h2>Conversie</h2>
              <span className="admin-muted">alleen bezoekers die cookies accepteren</span>
            </div>
            <div className="admin-card-body">
              {steps.length && steps[0][1] > 0 ? (
                <ul className="admin-funnel">
                  {steps.map(([label, n], i) => {
                    const pct = steps[0][1] ? (n / steps[0][1]) * 100 : 0;
                    const prev = i ? steps[i - 1][1] : 0;
                    return (
                      <li key={label}>
                        <div>
                          <span>{label}</span>
                          <b>{n.toLocaleString("nl-BE")}</b>
                        </div>
                        <i>
                          <em style={{ width: `${Math.max(1, Math.min(100, pct))}%` }} />
                        </i>
                        <small>
                          {i === 0 ? "100%" : `${pct.toFixed(1)}% van bezoekers${prev ? ` · ${((n / prev) * 100).toFixed(0)}% van vorige stap` : ""}`}
                        </small>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="admin-note">
                  Nog geen gegevens in deze periode. Bezoeken worden geteld vanaf nu, voor bezoekers die cookies
                  accepteren.
                </p>
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
            Winst = omzet{VAT_RATE ? " − btw" : ""} − kostprijs; terugbetalingen afgetrokken.
          </p>
        </div>
      </div>
    </>
  );
}
