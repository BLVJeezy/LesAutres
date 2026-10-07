"use client";
import { useEffect, useRef, useState } from "react";
import RevolutCheckout from "@revolut/checkout";
import type { CartItem } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY ?? "";
const MODE = process.env.NEXT_PUBLIC_REVOLUT_MODE === "sandbox" ? "sandbox" : "prod";

/** Revolut Pay (fast checkout) plus Apple Pay / Google Pay for the selected tees, without our checkout form. */
export function ExpressCheckout({
  items,
  amount,
  lang,
  cartId,
  label,
}: {
  items: CartItem[];
  amount: number;
  lang: Lang;
  cartId: string;
  label: string;
}) {
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
      const r = await fetch("/api/express", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: JSON.parse(key), cartId }),
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
          requestShipping: true,
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
          requestShipping: true,
          requestPayerEmail: true,
          requestPayerName: true,
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

  if (!PUBLIC_KEY) return null;
  return (
    <div className={`express ${ready ? "ready" : ""}`}>
      <span className="express-or">{label}</span>
      <div ref={walletRef} className="express-wallet" />
      <div ref={payRef} className="express-revolut" />
      {error && <p className="form-status">{error}</p>}
    </div>
  );
}
