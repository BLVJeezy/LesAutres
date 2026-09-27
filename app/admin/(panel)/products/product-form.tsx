"use client";
import { useActionState, useState } from "react";
import { money, sizes, VAT_RATE, type ShopProduct } from "@/lib/catalog";
import { saveProductAction, type FormState } from "../../actions";

const toEuro = (cents: number) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");
const parse = (v: string) => Math.round(Number(v.replace(",", ".")) * 100) || 0;

export function ProductForm({ product }: { product: ShopProduct }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProductAction, {});
  const [price, setPrice] = useState(toEuro(product.price));
  const [cost, setCost] = useState(toEuro(product.cost));
  const margin = Math.round(parse(price) / (1 + VAT_RATE)) - parse(cost);

  return (
    <form action={action} className="admin-form wide">
      <input type="hidden" name="id" value={product.id} />
      <label>
        Naam
        <input name="name" defaultValue={product.name} required maxLength={120} />
      </label>
      <label>
        Beschrijving
        <textarea name="description" defaultValue={product.description} rows={3} maxLength={1000} />
      </label>
      <div className="admin-row">
        <label>
          Verkoopprijs incl. btw (€)
          <input name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="65,00" />
        </label>
        <label>
          Kostprijs per stuk excl. btw (€)
          <input name="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} required placeholder="12,50" />
        </label>
        <div className="admin-margin">
          <span>Marge per stuk</span>
          <b>{money(margin)}</b>
        </div>
      </div>
      <label>
        Afbeelding (pad zoals /images/… of https-link)
        <input name="image" defaultValue={product.image} placeholder="/images/drop-001-product.jpeg" />
      </label>
      <fieldset>
        <legend>Voorraad per maat</legend>
        <div className="admin-stock">
          {sizes.map((s) => (
            <label key={s}>
              {s}
              <input name={`stock_${s}`} type="number" min={0} step={1} defaultValue={product.stock[s]} />
            </label>
          ))}
        </div>
      </fieldset>
      <div className="admin-row">
        <label>
          Volgorde in shop (laagste eerst)
          <input name="order" type="number" step={1} defaultValue={product.order} />
        </label>
        <label className="admin-check">
          <input name="active" type="checkbox" defaultChecked={product.active} />
          Online in de shop
        </label>
      </div>
      <button className="admin-btn" disabled={pending}>
        {pending ? "Opslaan…" : product.id ? "Opslaan" : "Product aanmaken"}
      </button>
      {state.error && <p className="admin-alert">{state.error}</p>}
      {state.ok && <p className="admin-ok">{state.ok}</p>}
    </form>
  );
}
