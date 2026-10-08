"use client";
import { useActionState } from "react";
import { testMailAction, type FormState } from "../actions";

export function TestMail({ from, support, configured }: { from: string; support: string; configured: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(testMailAction, {});
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <h2>E-mail</h2>
        <span className={`badge ${configured ? "success" : "attention"}`}>{configured ? "Resend gekoppeld" : "Niet gekoppeld"}</span>
      </div>
      <div className="admin-card-body">
        <dl className="admin-summary">
          <dt>Afzender</dt>
          <dd>{from}</dd>
          <dt>Antwoorden naar</dt>
          <dd>{support}</dd>
        </dl>
        <form action={action} style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <input name="to" type="email" required placeholder="jouw@email.com" className="admin-input" style={{ flex: 1, minWidth: 180, fontSize: 16, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }} />
          <button className="admin-btn secondary" name="kind" value="one" disabled={pending}>{pending ? "Bezig…" : "Stuur testmail"}</button>
          <button className="admin-btn" name="kind" value="all" disabled={pending}>{pending ? "Bezig…" : "Stuur alle 3 testmails"}</button>
        </form>
        {state.error && <p className="admin-note" style={{ color: "#b42318", marginTop: 8 }}>{state.error}</p>}
        {state.ok && <p className="admin-note" style={{ color: "#067647", marginTop: 8 }}>{state.ok}</p>}
      </div>
    </section>
  );
}
