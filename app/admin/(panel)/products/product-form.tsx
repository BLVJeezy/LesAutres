"use client";
import { useActionState, useEffect, useState } from "react";
import { money, sizes, VAT_RATE, type ShopProduct } from "@/lib/catalog";
import { saveProductAction, type FormState } from "../../actions";
import { ImageManager } from "./image-manager";

const toEuro = (cents: number) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");
const parse = (v: string) => Math.round(Number(v.replace(",", ".")) * 100) || 0;

export function ProductForm({
  product,
  canUpload,
  onSaved,
  onCancel,
}: {
  product: ShopProduct;
  canUpload: boolean;
  onSaved?: (state: FormState) => void;
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProductAction, {});
  const [price, setPrice] = useState(toEuro(product.price));
  const [cost, setCost] = useState(toEuro(product.cost));
  const [active, setActive] = useState(product.active);
  const priceExVat = Math.round(parse(price) / (1 + VAT_RATE));
  const margin = priceExVat - parse(cost);

  useEffect(() => {
    if (state.savedId) onSaved?.(state);
  }, [state, onSaved]);

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={product.id} />
      {state.error && <p className="admin-alert">{state.error}</p>}
      {state.ok && !onSaved && <p className="admin-ok">{state.ok}</p>}
      <div className="admin-grid-2">
        <div className="admin-stack">
          <section className="admin-section">
            <label>
              Titel
              <input name="name" defaultValue={product.name} required maxLength={120} placeholder="Bijv. The Baddies Tee" />
            </label>
            <label>
              Beschrijving
              <textarea name="description" defaultValue={product.description} rows={4} maxLength={1000} />
            </label>
          </section>

          <section className="admin-section">
            <h3>Media</h3>
            <ImageManager initial={product.images} canUpload={canUpload} />
          </section>

          <section className="admin-section">
            <h3>Prijzen</h3>
            <div className="admin-row">
              <label>
                Prijs{VAT_RATE ? " (incl. btw)" : ""}
                <input name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="€ 0,00" />
              </label>
              <label>
                Kostprijs per artikel
                <input name="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} required placeholder="€ 0,00" />
              </label>
            </div>
            <div className="admin-row">
              <div className="admin-margin">
                <span>Winst</span>
                <b>{parse(cost) ? money(margin) : "—"}</b>
              </div>
              <div className="admin-margin">
                <span>Marge</span>
                <b>{parse(cost) && priceExVat > 0 ? `${Math.round((margin / priceExVat) * 100)}%` : "—"}</b>
              </div>
            </div>
            <p className="admin-note">Winst en marge{VAT_RATE ? " excl. btw" : ""}, vóór betaalkosten.</p>
          </section>

          <section className="admin-section">
            <h3>Voorraad</h3>
            <div className="admin-stock">
              {sizes.map((s) => (
                <label key={s}>
                  {s}
                  <input name={`stock_${s}`} type="number" inputMode="numeric" min={0} step={1} defaultValue={product.stock[s] || ""} placeholder="0" />
                </label>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-section">
            <h3>Status</h3>
            <label className="admin-check">
              <input name="active" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              Actief — zichtbaar in de shop
            </label>
            <span className={`badge ${active ? "success" : "info"}`} style={{ alignSelf: "flex-start" }}>
              {active ? "Actief" : "Concept"}
            </span>
          </section>
          <section className="admin-section">
            <h3>Organisatie</h3>
            <label>
              Volgorde in shop
              <input name="order" type="number" step={1} defaultValue={product.order} />
            </label>
            <p className="admin-note">Laagste nummer staat bovenaan de shop.</p>
          </section>
        </div>
      </div>
      <div className="admin-actions">
        {onCancel && (
          <button type="button" className="admin-btn secondary" onClick={onCancel}>
            Annuleren
          </button>
        )}
        <button className="admin-btn" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
