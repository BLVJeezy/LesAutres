"use client";
import { useState } from "react";

export function WithdrawForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; at: number; mailed: boolean } | null>(null);

  if (done)
    return (
      <div className="legal-form" role="status">
        <h2>Je herroeping is ontvangen.</h2>
        <p>
          Referentie <b>{done.id}</b>, ontvangen op{" "}
          {new Date(done.at).toLocaleString("nl-BE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Brussels" })}.
        </p>
        <p>
          {done.mailed
            ? "Je krijgt ook een ontvangstbevestiging per e-mail."
            : "Bewaar of print deze bevestiging; we nemen per e-mail contact met je op."}
        </p>
      </div>
    );

  return (
    <form
      className="withdraw-form checkout-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        try {
          const res = await fetch("/api/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error);
          setDone(json);
        } catch (err) {
          setError((err as Error).message || "Er ging iets mis. Probeer opnieuw.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="checkout-field">
        <span>Naam</span>
        <input name="name" required maxLength={120} autoComplete="name" />
      </label>
      <label className="checkout-field">
        <span>E-mailadres van je bestelling</span>
        <input name="email" type="email" required maxLength={254} autoComplete="email" />
      </label>
      <label className="checkout-field">
        <span>Bestelnummer (bv. #7K3QX9)</span>
        <input name="orderNumber" required maxLength={40} />
      </label>
      <label className="checkout-field">
        <span>Welke artikelen? (leeg = volledige bestelling)</span>
        <textarea name="items" maxLength={1000} />
      </label>
      <button className="buy" disabled={busy}>
        {busy ? "EVEN GEDULD…" : "HERROEPING BEVESTIGEN"}
      </button>
      <p role="alert" className="form-status">
        {error}
      </p>
    </form>
  );
}
