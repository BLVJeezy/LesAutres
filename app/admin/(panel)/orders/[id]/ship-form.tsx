"use client";
import { useActionState } from "react";
import { shipOrderAction, type FormState } from "../../../actions";
import { CARRIERS, type CarrierId } from "@/lib/tracking";

export function ShipForm({
  orderId,
  carrier,
  code,
  url,
  shipped,
}: {
  orderId: string;
  carrier: CarrierId;
  code: string;
  url: string | null;
  shipped: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(shipOrderAction, {});
  return (
    <form action={action} className="admin-ship">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="admin-ship-row">
        <select name="carrier" defaultValue={carrier} aria-label="Vervoerder">
          {CARRIERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input name="code" defaultValue={code} placeholder="Trackingcode of -link" aria-label="Trackingcode" />
        <button className="admin-btn" disabled={pending}>
          {pending ? "Bezig…" : shipped ? "Tracking bijwerken" : "Verzenden & klant mailen"}
        </button>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener" className="admin-link">
          Open trackinglink ↗
        </a>
      )}
      {state.error && <p className="admin-error">{state.error}</p>}
      {state.ok && <p className="admin-ok">{state.ok}</p>}
    </form>
  );
}
