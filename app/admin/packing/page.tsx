import { requireAdmin } from "@/lib/admin-auth";
import { money, sizes } from "@/lib/catalog";
import { shippingLabel } from "@/lib/shipping";
import { adminProducts, listOrders, orderNumbers } from "@/lib/shop";
import { PrintButton } from "../labels/print-button";

const COUNTRY: Record<string, string> = { BE: "België", NL: "Nederland", LU: "Luxemburg", FR: "Frankrijk", DE: "Duitsland", ES: "Spanje" };

export const metadata = { title: "Orderoverzicht — Les Autres" };

const CSS = `
.pack { background: #e9e9e6; min-height: 100vh; padding: 16px; color: #111; font-family: Helvetica, Arial, sans-serif; }
.pack-bar { max-width: 210mm; margin: 0 auto 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 14px; }
.pack-bar button { background: #111; color: #fff; border: 0; padding: 12px 18px; font-weight: 700; border-radius: 6px; }
.pack-doc { max-width: 210mm; margin: 0 auto; background: #fff; padding: 12mm; box-sizing: border-box; box-shadow: 0 2px 12px #0002; }
.pack h1 { font-size: 18pt; margin: 0 0 2mm; }
.pack .muted { color: #666; font-size: 9pt; }
.pack table { width: 100%; border-collapse: collapse; font-size: 10pt; }
.pack th, .pack td { text-align: left; padding: 1.6mm 2mm; border-bottom: 0.2mm solid #ddd; vertical-align: top; }
.pack th { font-size: 8pt; text-transform: uppercase; letter-spacing: .06em; color: #555; }
.pack .num { text-align: right; }
.pack .summary { margin: 6mm 0 8mm; }
.pack .order { border: 0.3mm solid #111; border-radius: 2mm; padding: 4mm 5mm; margin-bottom: 5mm; break-inside: avoid; page-break-inside: avoid; }
.pack .order-head { display: flex; justify-content: space-between; gap: 4mm; align-items: baseline; }
.pack .order-head b { font-size: 14pt; }
.pack .order-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin: 3mm 0; font-size: 10pt; }
.pack .check { display: inline-block; width: 4mm; height: 4mm; border: 0.3mm solid #111; margin-right: 2mm; vertical-align: middle; }
.pack .tag { display: inline-block; font-size: 8pt; padding: 0.5mm 2mm; border-radius: 1mm; background: #eee; margin-left: 2mm; }
@media (max-width: 600px) { .pack-doc { padding: 5mm; } .pack .order-grid { grid-template-columns: 1fr; } }
@media print {
  @page { size: A4; margin: 10mm; }
  .pack { background: #fff; padding: 0; }
  .pack-bar { display: none; }
  .pack-doc { box-shadow: none; padding: 0; max-width: none; }
}`;

export default async function Packing({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  await requireAdmin();
  const { ids } = await searchParams;
  const picked = ids ? new Set(ids.split(",")) : null;
  const [orders, products] = await Promise.all([listOrders(), adminProducts()]);
  const numbers = orderNumbers(orders);
  const list = orders
    .filter((o) => (picked ? picked.has(o.id) : !o.test && !o.shippedAt && o.refunded < o.total))
    .sort((a, b) => a.created - b.created);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Artikel";

  // Totals per product and size, so you know what to pick from stock.
  const totals = new Map<string, Record<string, number>>();
  for (const o of list)
    for (const [pid, size, qty] of o.lines) {
      const row = totals.get(pid) ?? {};
      row[size] = (row[size] ?? 0) + qty;
      totals.set(pid, row);
    }
  const units = list.reduce((n, o) => n + o.lines.reduce((m, l) => m + l[2], 0), 0);
  const fmt = (s: number) =>
    new Date(s * 1000).toLocaleString("nl-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" });

  return (
    <div className="pack">
      <style>{CSS}</style>
      <div className="pack-bar">
        <span>
          <b>{list.length}</b> bestellingen · {units} stuks · <a href="/admin/orders/export?type=orders">Andere bestellingen kiezen</a>
        </span>
        <PrintButton />
      </div>
      <div className="pack-doc">
        <h1>Orderoverzicht</h1>
        <div className="muted">
          {list.length} bestellingen · {units} stuks · gemaakt op{" "}
          {new Date().toLocaleString("nl-BE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" })}
        </div>

        <table className="summary">
          <thead>
            <tr>
              <th>Te pakken</th>
              {sizes.map((s) => (
                <th key={s} className="num">{s}</th>
              ))}
              <th className="num">Totaal</th>
            </tr>
          </thead>
          <tbody>
            {[...totals].map(([pid, row]) => (
              <tr key={pid}>
                <td><b>{name(pid)}</b></td>
                {sizes.map((s) => (
                  <td key={s} className="num">{row[s] ?? "–"}</td>
                ))}
                <td className="num"><b>{Object.values(row).reduce((a, b) => a + b, 0)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.map((o) => (
          <div className="order" key={o.id}>
            <div className="order-head">
              <span>
                <span className="check" />
                <b>#{numbers.get(o.id)}</b>
                {o.shippedAt && <span className="tag">verzonden</span>}
              </span>
              <span className="muted">{fmt(o.created)} · {shippingLabel(o.shippingMethod)}</span>
            </div>
            <div className="order-grid">
              <div>
                <b>{o.name || "—"}</b>
                <div>{o.address ? o.address.split(", ").map((l, i) => <div key={i}>{COUNTRY[l] ?? l}</div>) : "Adres ontbreekt"}</div>
              </div>
              <div>
                <div>{o.email}</div>
                <div>{o.phone}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th>Maat</th>
                  <th className="num">Aantal</th>
                  <th className="num">Prijs</th>
                </tr>
              </thead>
              <tbody>
                {o.lines.map(([pid, size, qty, price]) => (
                  <tr key={`${pid}-${size}`}>
                    <td>{name(pid)}</td>
                    <td><b>{size}</b></td>
                    <td className="num"><b>{qty}</b></td>
                    <td className="num">{money(price * qty)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>Totaal betaald{o.discount ? ` (bundelkorting −${money(o.discount)})` : ""}</td>
                  <td className="num"><b>{money(o.total)}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
        {list.length === 0 && <p>Geen bestellingen gekozen.</p>}
      </div>
    </div>
  );
}
