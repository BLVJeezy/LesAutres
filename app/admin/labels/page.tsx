import { requireAdmin } from "@/lib/admin-auth";
import { company, returnAddress } from "@/lib/company";
import { shippingLabel } from "@/lib/shipping";
import { adminProducts, listOrders, orderNumbers } from "@/lib/shop";
import { PrintButton } from "./print-button";

const COUNTRY: Record<string, string> = { BE: "BELGIË", NL: "NEDERLAND", LU: "LUXEMBOURG", FR: "FRANCE", DE: "DEUTSCHLAND", ES: "ESPAÑA" };

export const metadata = { title: "Verzendlabels — Les Autres" };

const CSS = `
.labels-page { background: #e9e9e6; min-height: 100vh; padding: 24px; color: #111; font-family: Helvetica, Arial, sans-serif; }
.labels-bar { max-width: 210mm; margin: 0 auto 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.labels-bar p { margin: 0; font-size: 14px; }
.labels-bar button { background: #111; color: #fff; border: 0; padding: 12px 18px; font-weight: 700; cursor: pointer; border-radius: 6px; }
.sheet-a4 { width: 210mm; min-height: 297mm; margin: 0 auto 16px; background: #fff; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 74.25mm; box-shadow: 0 2px 12px #0002; }
.label { box-sizing: border-box; padding: 7mm 8mm; border: 0.2mm dashed #bbb; display: flex; flex-direction: column; gap: 2.5mm; overflow: hidden; }
.label-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: #555; }
.label-top b { font-size: 12pt; color: #111; letter-spacing: 0; }
.label-to { font-size: 7pt; text-transform: uppercase; letter-spacing: .1em; color: #777; }
.label-name { font-size: 15pt; font-weight: 800; line-height: 1.1; }
.label-addr { font-size: 12pt; line-height: 1.3; }
.label-meta { margin-top: auto; border-top: 0.3mm solid #111; padding-top: 2mm; display: flex; justify-content: space-between; gap: 4mm; font-size: 8pt; }
.label-from { font-size: 7.5pt; color: #444; }
.sheet-a6 { width: 105mm; height: 148mm; margin: 0 auto 16px; background: #fff; box-shadow: 0 2px 12px #0002; display: flex; }
.sheet-a6 .label { width: 100%; border: 0; padding: 9mm 8mm; gap: 3.5mm; }
.sheet-a6 .label-name { font-size: 20pt; }
.sheet-a6 .label-addr { font-size: 15pt; }
.sheet-a6 .label-top b { font-size: 16pt; }
@media screen and (max-width: 500px) {
  .labels-page { padding: 12px; }
  .sheet-a6 { zoom: 0.85; }
  .sheet-a4 { zoom: 0.44; }
}
@media print {
  @page { size: var(--page-size); margin: 0; }
  .labels-page { background: #fff; padding: 0; }
  .labels-bar { display: none; }
  .sheet-a4, .sheet-a6 { box-shadow: none; margin: 0; zoom: 1 !important; }
  .sheet-a4:not(:last-child), .sheet-a6:not(:last-child) { page-break-after: always; break-after: page; }
  .label { border-color: #ddd; }
}`;

export default async function Labels({
  searchParams,
}: {
  searchParams: Promise<{ all?: string; ids?: string; layout?: string }>;
}) {
  await requireAdmin();
  const { all, ids, layout } = await searchParams;
  const a6 = layout === "a6";
  const picked = ids ? new Set(ids.split(",")) : null;
  const [orders, products] = await Promise.all([listOrders(), adminProducts()]);
  const numbers = orderNumbers(orders);
  const todo = orders
    .filter((o) => (picked ? picked.has(o.id) : !o.test && o.refunded < o.total && (all === "1" || !o.shippedAt)))
    .sort((a, b) => a.created - b.created);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? "Artikel";
  const from = [company.brand, returnAddress()].filter(Boolean).join(" · ") || `${company.brand} · België`;
  const pages: (typeof todo)[] = [];
  const per = a6 ? 1 : 8;
  for (let i = 0; i < todo.length; i += per) pages.push(todo.slice(i, i + per));

  return (
    <div className="labels-page">
      <style>{CSS.replace("var(--page-size)", a6 ? "105mm 148mm" : "A4")}</style>
      <div className="labels-bar">
        <p>
          <b>{todo.length}</b> {todo.length === 1 ? "label" : "labels"} ·{" "}
          {a6 ? "1 per pagina (A6, 105 × 148 mm)" : "A4, 8 per blad (105 × 74 mm)"}.{" "}
          <a href="/admin/orders/export?type=labels">Andere bestellingen kiezen</a>
        </p>
        <PrintButton />
      </div>
      {todo.length === 0 && <p style={{ textAlign: "center" }}>Geen bestellingen om te verzenden.</p>}
      {pages.map((page, i) => (
        <div className={a6 ? "sheet-a6" : "sheet-a4"} key={i}>
          {page.map((o) => {
            const lines = o.address
              ? o.address.split(", ").map((l) => COUNTRY[l] ?? l)
              : ["Adres ontbreekt — contacteer klant"];
            return (
              <div className="label" key={o.id}>
                <div className="label-top">
                  <span>{shippingLabel(o.shippingMethod)}</span>
                  <b>#{numbers.get(o.id)}</b>
                </div>
                <span className="label-to">Aan</span>
                <div className="label-name">{o.name || o.email}</div>
                <div className="label-addr">
                  {lines.map((l, j) => (
                    <div key={j}>{l}</div>
                  ))}
                  {o.phone && <div style={{ fontSize: "9pt", marginTop: "1mm" }}>{o.phone}</div>}
                </div>
                <div className="label-meta">
                  <span>
                    {o.lines.map(([pid, size, qty]) => `${qty}× ${name(pid)} ${size}`).join(" · ")}
                  </span>
                </div>
                <div className="label-from">Afzender: {from}</div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
