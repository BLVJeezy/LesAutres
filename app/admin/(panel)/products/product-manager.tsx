"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  emptyStock,
  money,
  totalStock,
  VAT_RATE,
  type ShopProduct,
} from "@/lib/catalog";
import type { FormState } from "../../actions";
import { ProductForm } from "./product-form";

const blank: ShopProduct = {
  id: "",
  name: "",
  description: "",
  price: 0,
  cost: 0,
  image: "",
  images: [],
  stock: emptyStock(),
  active: true,
  order: 0,
};

export function ProductManager({
  products,
  connected,
  canUpload,
}: {
  products: ShopProduct[];
  connected: boolean;
  canUpload: boolean;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (editing) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editing]);

  const close = useCallback(() => setEditing(null), []);
  const saved = useCallback(
    (state: FormState) => {
      setEditing(null);
      setNotice(state.ok ?? "Opgeslagen.");
      router.refresh();
    },
    [router],
  );

  return (
    <>
      <div className="admin-head">
        <h1>Producten</h1>
        {connected && (
          <button
            className="admin-btn"
            onClick={() => {
              setNotice("");
              setEditing({
                ...blank,
                order: products.reduce((max, p) => Math.max(max, p.order), -1) + 1,
              });
            }}
          >
            + Nieuw product
          </button>
        )}
      </div>
      {notice && <p className="admin-ok">{notice}</p>}
      <div className="admin-product-list">
        {products.map((p) => {
          const margin = Math.round(p.price / (1 + VAT_RATE)) - p.cost;
          return (
            <article key={p.id} className={`admin-product ${p.active ? "" : "muted"}`}>
              <div className="admin-product-thumb">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" />
                )}
              </div>
              <div className="admin-product-main">
                <b>{p.name}</b>
                <span>
                  {!connected
                    ? "Concept — wacht op Stripe"
                    : p.active
                      ? "Online"
                      : "Offline"}
                  {" · "}
                  {p.images.length} foto{p.images.length === 1 ? "" : "'s"}
                </span>
              </div>
              <dl>
                <dt>Prijs</dt><dd>{money(p.price)}</dd>
                <dt>Kostprijs</dt><dd>{p.cost ? money(p.cost) : "—"}</dd>
                <dt>Marge</dt><dd>{p.cost ? money(margin) : "—"}</dd>
                <dt>Voorraad</dt><dd className={totalStock(p) <= 5 ? "low" : ""}>{totalStock(p)}</dd>
              </dl>
              <button className="admin-btn small" onClick={() => { setNotice(""); setEditing(p); }}>
                Bewerken
              </button>
            </article>
          );
        })}
      </div>
      <p className="admin-note">
        Marge per stuk = verkoopprijs excl. btw − kostprijs (vóór Stripe-kosten).
      </p>

      <dialog ref={dialog} className="admin-dialog" onClose={close} onCancel={close}>
        {editing && (
          <>
            <div className="admin-dialog-head">
              <h2>{editing.id ? editing.name : "Nieuw product"}</h2>
              <button className="admin-link" onClick={close} aria-label="Sluiten">✕</button>
            </div>
            {!connected && (
              <p className="admin-alert">
                Opslaan kan zodra Stripe gekoppeld is.
              </p>
            )}
            <ProductForm
              key={editing.id || "new"}
              product={editing}
              canUpload={canUpload}
              onSaved={saved}
              onCancel={close}
            />
          </>
        )}
      </dialog>
    </>
  );
}
