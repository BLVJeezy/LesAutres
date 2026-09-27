"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  emptyStock,
  money,
  sizes,
  totalStock,
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

type Filter = "all" | "active" | "draft";

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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
  const open = (p: ShopProduct) => {
    setNotice("");
    setEditing(p);
  };

  const shown = products.filter(
    (p) =>
      (filter === "all" || (filter === "active" ? p.active : !p.active)) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <div className="admin-head">
        <h1>Producten</h1>
        {connected && (
          <button
            className="admin-btn"
            onClick={() =>
              open({ ...blank, order: products.reduce((max, p) => Math.max(max, p.order), -1) + 1 })
            }
          >
            Product toevoegen
          </button>
        )}
      </div>
      {notice && <p className="admin-ok">{notice}</p>}

      <section className="admin-card">
        <div className="admin-filterbar">
          <nav className="admin-tabs" aria-label="Filter">
            {(
              [
                ["all", "Alle"],
                ["active", "Actief"],
                ["draft", "Concept"],
              ] as [Filter, string][]
            ).map(([f, label]) => (
              <a
                key={f}
                href="#"
                aria-current={f === filter ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setFilter(f);
                }}
              >
                {label}
              </a>
            ))}
          </nav>
          <label className="admin-search">
            <Search size={16} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zoek producten"
              aria-label="Zoek producten"
            />
          </label>
        </div>
        {shown.length ? (
          <div className="admin-scroll">
            <table className="admin-table rows products-rows">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Voorraad</th>
                  <th className="num">Prijs</th>
                  <th className="num admin-hide-mobile">Kostprijs</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const stock = totalStock(p);
                  const sizesIn = sizes.filter((s) => p.stock[s] > 0).length;
                  return (
                    <tr
                      key={p.id}
                      className="clickable"
                      tabIndex={0}
                      onClick={() => open(p)}
                      onKeyDown={(e) => e.key === "Enter" && open(p)}
                    >
                      <td className="c-prod">
                        <div className="product-cell">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="thumb" src={p.image} alt="" />
                          ) : (
                            <span className="thumb" />
                          )}
                          <b>{p.name}</b>
                        </div>
                      </td>
                      <td className="c-status">
                        <span className={`badge ${p.active && connected ? "success" : "info"}`}>
                          {p.active && connected ? "Actief" : "Concept"}
                        </span>
                      </td>
                      <td className={`c-stock ${stock === 0 ? "low" : ""}`}>
                        {stock === 0
                          ? "Uitverkocht"
                          : `${stock} op voorraad in ${sizesIn} ${sizesIn === 1 ? "maat" : "maten"}`}
                      </td>
                      <td className="num c-price">{money(p.price)}</td>
                      <td className="num admin-hide-mobile">{p.cost ? money(p.cost) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">Geen producten gevonden.</p>
        )}
      </section>

      <dialog ref={dialog} className="admin-dialog" onClose={close} onCancel={close}>
        {editing && (
          <>
            <div className="admin-dialog-head">
              <h2>{editing.id ? editing.name : "Product toevoegen"}</h2>
              <button className="admin-link" onClick={close} aria-label="Sluiten">
                <X size={18} />
              </button>
            </div>
            <div className="admin-dialog-content">
              {!connected && <p className="admin-alert">Opslaan kan zodra Firebase gekoppeld is.</p>}
              <ProductForm
                key={editing.id || "new"}
                product={editing}
                canUpload={canUpload}
                onSaved={saved}
                onCancel={close}
              />
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
