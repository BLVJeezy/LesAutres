"use client";
import { useActionState } from "react";
import { loginAction, type FormState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="admin-form">
      <label>
        Wachtwoord
        <input name="password" type="password" required autoFocus autoComplete="current-password" />
      </label>
      <button className="admin-btn" disabled={pending}>
        {pending ? "…" : "Inloggen"}
      </button>
      {state.error && <p className="admin-alert">{state.error}</p>}
    </form>
  );
}
