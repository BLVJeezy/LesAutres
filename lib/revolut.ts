import { createHmac, timingSafeEqual } from "node:crypto";

// Revolut Merchant API. REVOLUT_API_BASE points at the sandbox or a local mock; leave unset in production.
const API_VERSION = "2024-09-01";
const base = () => process.env.REVOLUT_API_BASE ?? "https://merchant.revolut.com";

export const revolutConfigured = () => Boolean(process.env.REVOLUT_SECRET_KEY);

export type RevolutOrder = {
  id: string;
  token?: string;
  state: "pending" | "processing" | "authorised" | "completed" | "cancelled" | "failed";
  amount: number;
  currency: string;
  outstanding_amount?: number;
  refunded_amount?: number;
  checkout_url?: string;
  created_at?: string;
  merchant_order_data?: { reference?: string };
  merchant_order_ext_ref?: string;
  /** Filled by Revolut Pay fast checkout / Apple Pay / Google Pay. */
  customer?: { email?: string; full_name?: string; phone?: string };
  shipping?: { address?: RevolutAddress; contact?: { name?: string; email?: string; phone?: string } };
  shipping_address?: RevolutAddress;
};

export type RevolutAddress = {
  street_line_1?: string;
  street_line_2?: string;
  postcode?: string;
  city?: string;
  region?: string;
  country_code?: string;
};

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const key = process.env.REVOLUT_SECRET_KEY;
  if (!key) throw new Error("Revolut is niet geconfigureerd.");
  const res = await fetch(`${base()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Revolut-Api-Version": API_VERSION,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Revolut ${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export type NewOrder = {
  amount: number;
  reference: string;
  description: string;
  redirectUrl: string;
  customer?: { email: string; full_name: string; phone?: string };
  shipping?: {
    street_line_1: string;
    street_line_2?: string;
    postcode: string;
    city: string;
    country_code: string;
  };
};

export function createRevolutOrder(o: NewOrder) {
  return call<RevolutOrder>("/api/orders", {
    method: "POST",
    body: {
      amount: o.amount,
      currency: "EUR",
      description: o.description.slice(0, 1000),
      ...(o.customer && { customer: o.customer }),
      ...(o.shipping && { shipping_address: o.shipping }),
      redirect_url: o.redirectUrl,
      merchant_order_data: { reference: o.reference },
      metadata: { shop: "les-autres", reference: o.reference },
    },
  });
}

export const getRevolutOrder = (id: string) =>
  call<RevolutOrder>(`/api/orders/${encodeURIComponent(id)}`);

export function createRevolutWebhook(url: string) {
  return call<{ id: string; signing_secret: string }>("/api/1.0/webhooks", {
    method: "POST",
    body: { url, events: ["ORDER_COMPLETED", "ORDER_AUTHORISED"] },
  });
}

/** Checks the Revolut-Signature header ("v1=<hex>", possibly several comma-separated). */
export function validRevolutSignature(raw: string, timestamp: string | null, header: string | null, secret: string) {
  if (!timestamp || !header) return false;
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60_000) return false;
  const expected = createHmac("sha256", secret).update(`v1.${timestamp}.${raw}`).digest("hex");
  return header.split(",").some((part) => {
    const sig = part.trim().replace(/^v1=/, "");
    return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  });
}
