import type { CartItem, Size } from "./catalog";
export type EventName =
  | "page_view"
  | "size_advice"
  | "view_product"
  | "select_size"
  | "select_colorway"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "join_waitlist";
export function trackEvent(
  name: EventName,
  context: Record<string, unknown> = {},
) {
  if (
    typeof window === "undefined" ||
    localStorage.getItem("la-consent") !== "accepted"
  )
    return;
  window.dispatchEvent(
    new CustomEvent("les-autres:analytics", { detail: { name, context } }),
  );
  // Anonymous daily counters (no cookies, no personal data), only after consent.
  try {
    const body = JSON.stringify({ name });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" })))
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {}
}
export async function onSubscribe(
  email: string,
  context: { type: "drop" | "restock"; size?: Size; color?: string },
) {
  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, context, consent: true }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  trackEvent("join_waitlist", context);
  return data;
}
export type Customer = {
  name: string;
  email: string;
  phone: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
};
export const EMPTY_CUSTOMER: Customer = {
  name: "",
  email: "",
  phone: "",
  street: "",
  postcode: "",
  city: "",
  country: "BE",
};
export async function onCheckout(cart: CartItem[], customer: Customer, shippingMethod: string, cartId?: string) {
  trackEvent("begin_checkout", { cart });
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart, customer, shippingMethod, cartId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  window.location.assign(data.url);
}
