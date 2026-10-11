"use client";
import { useEffect, useRef, useState } from "react";
import RevolutCheckout from "@revolut/checkout";
import type { CartItem } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

/** Express checkout (Revolut Pay, Apple Pay, Google Pay) on the product page. */
const EXPRESS_ENABLED = true;
const MODE = process.env.NEXT_PUBLIC_REVOLUT_MODE === "sandbox" ? "sandbox" : "prod";

export type ExpressLabels = {
  name: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  countries: Record<string, string>;
  needDetails: string;
};
type Details = { name: string; email: string; phone: string; street: string; postcode: string; city: string; country: string };
const EMPTY: Details = { name: "", email: "", phone: "", street: "", postcode: "", city: "", country: "BE" };
const COUNTRIES = ["BE", "NL", "LU", "FR", "DE", "ES"];
/** Same minimum the server enforces; the server also normalises and re-checks the phone number. */
const complete = (d: Details) =>
  /^\S+@\S+\.\S+$/.test(d.email.trim()) &&
  d.name.trim().length >= 2 &&
  d.street.trim().length >= 3 &&
  d.postcode.trim().length >= 3 &&
  d.city.trim().length >= 2 &&
  d.phone.replace(/\D/g, "").length >= 8;

/** Revolut Pay plus Apple Pay / Google Pay for the selected tees. Contact and shipping details are always asked first. */
export function ExpressCheckout({
  items,
  amount,
  lang,
  cartId,
  label,
  publicKey,
  labels,
}: {
  items: CartItem[];
  amount: number;
  lang: Lang;
  cartId: string;
  label: string;
  publicKey: string;
  labels: ExpressLabels;
}) {
  const [details, setDetails] = useState<Details>(EMPTY);
  const detailsRef = useRef<Details>(EMPTY);
  detailsRef.current = details;
  const ok = complete(details);
  const PUBLIC_KEY = publicKey;
  const payRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const orderId = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const key = JSON.stringify(items);

  useEffect(() => {
    if (!PUBLIC_KEY || !payRef.current || !walletRef.current || amount <= 0) return;
    let cancelled = false;
    const cleanup: (() => void)[] = [];
    const createOrder = async () => {
      setError("");
      if (!complete(detailsRef.current)) {
        setError(labels.needDetails);
        throw new Error(labels.needDetails);
      }
      const r = await fetch("/api/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: JSON.parse(key), cartId, customer: detailsRef.current }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.publicId) {
        const message = d.error ?? "Afrekenen lukt nu niet.";
        setError(message);
        throw new Error(message);
      }
      orderId.current = d.orderId;
      return { publicId: d.publicId as string };
    };
    const done = () => {
      if (orderId.current) window.location.href = `/bedankt?order=${encodeURIComponent(orderId.current)}`;
    };
    const origin = window.location.origin;
    const urls = { success: `${origin}/bedankt`, failure: `${origin}/#drop`, cancel: `${origin}/#drop` };
    RevolutCheckout.payments({ publicToken: PUBLIC_KEY, mode: MODE, locale: lang })
      .then(async (payments) => {
        if (cancelled) return payments.destroy();
        cleanup.push(() => payments.destroy());
        payments.revolutPay.mount(payRef.current, {
          currency: "EUR",
          totalAmount: amount,
          requestShipping: false,
          createOrder,
          redirectUrls: urls,
          mobileRedirectUrls: urls,
          buttonStyle: { variant: "dark", radius: "none", size: "large", height: "52px", action: "buy" },
        });
        payments.revolutPay.on("payment", (event) => {
          if (event.type === "success") done();
          else if (event.type === "error") setError(event.error?.message ?? "Betaling mislukt.");
        });
        const wallet = payments.paymentRequest(walletRef.current!, {
          amount,
          currency: "EUR",
          requestShipping: false,
          createOrder,
          onSuccess: done,
          onError: (e) => setError(e?.message ?? "Betaling mislukt."),
          buttonStyle: { variant: "dark", radius: "none", size: "large", height: "52px", action: "buy" },
        });
        cleanup.push(() => wallet.destroy());
        if (await wallet.canMakePayment()) await wallet.render();
        if (!cancelled) setReady(true);
      })
      .catch((e) => console.error("Revolut express checkout failed to load", e));
    return () => {
      cancelled = true;
      cleanup.forEach((f) => f());
    };
  }, [amount, key, lang, cartId]);

  if (!PUBLIC_KEY || !EXPRESS_ENABLED) return null;
  return (
    <div className={`express ${ready ? "ready" : ""}`}>
      <span className="express-or">{label}</span>
      <div className="express-details">
        <label>
          <span>{labels.name}</span>
          <input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} autoComplete="name" maxLength={120} />
        </label>
        <label>
          <span>{labels.email}</span>
          <input value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} type="email" autoComplete="email" maxLength={254} />
        </label>
        <label>
          <span>{labels.phone}</span>
          <input value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} type="tel" autoComplete="tel" maxLength={30} />
        </label>
        <label>
          <span>{labels.street}</span>
          <input value={details.street} onChange={(e) => setDetails({ ...details, street: e.target.value })} autoComplete="address-line1" maxLength={200} />
        </label>
        <div className="express-row">
        <label>
          <span>{labels.postcode}</span>
          <input value={details.postcode} onChange={(e) => setDetails({ ...details, postcode: e.target.value })} autoComplete="postal-code" maxLength={12} />
        </label>
        <label>
          <span>{labels.city}</span>
          <input value={details.city} onChange={(e) => setDetails({ ...details, city: e.target.value })} autoComplete="address-level2" maxLength={80} />
        </label>
        </div>
        <label>
          <span>{labels.country}</span>
          <select value={details.country} onChange={(e) => setDetails({ ...details, country: e.target.value })} autoComplete="country">
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{labels.countries[c] ?? c}</option>
            ))}
          </select>
        </label>
      </div>
      {!ok && <p className="express-hint">{labels.needDetails}</p>}
      <div className={`express-buttons ${ok ? "" : "locked"}`} aria-disabled={!ok}>
        <div ref={walletRef} className="express-wallet" />
        <div ref={payRef} className="express-revolut" />
      </div>
      {error && <p className="form-status">{error}</p>}
    </div>
  );
}
