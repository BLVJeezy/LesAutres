"use client";
import { useState } from "react";
type Labels = Record<
  "addressTitle" | "addressLead" | "name" | "street" | "postcode" | "city" | "country" | "phone" | "save" | "saved" | "error",
  string
>;

const COUNTRIES = ["BE", "NL", "LU", "FR", "DE", "ES"];

export function AddressForm({ orderId, t, countries }: { orderId: string; t: Labels; countries: Record<string, string> }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  if (state === "done") return <p className="thanks-lead"><b>{t.saved}</b></p>;
  return (
    <form
      className="thanks-address"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch("/api/order-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...f, orderId }),
        }).catch(() => null);
        setState(r?.ok ? "done" : "error");
      }}
    >
      <h2>{t.addressTitle}</h2>
      <p>{t.addressLead}</p>
      <label>{t.name}<input name="name" required autoComplete="name" maxLength={120} /></label>
      <label>{t.street}<input name="street" required autoComplete="address-line1" maxLength={200} /></label>
      <div className="thanks-row">
        <label>{t.postcode}<input name="postcode" required autoComplete="postal-code" maxLength={12} /></label>
        <label>{t.city}<input name="city" required autoComplete="address-level2" maxLength={80} /></label>
      </div>
      <label>
        {t.country}
        <select name="country" defaultValue="BE" autoComplete="country">
          {COUNTRIES.map((c) => <option key={c} value={c}>{countries[c] ?? c}</option>)}
        </select>
      </label>
      <label>{t.phone}<input name="phone" type="tel" required autoComplete="tel" maxLength={30} /></label>
      <button className="buy" disabled={state === "busy"}>{state === "busy" ? "…" : t.save}</button>
      {state === "error" && <p className="form-status">{t.error}</p>}
    </form>
  );
}
