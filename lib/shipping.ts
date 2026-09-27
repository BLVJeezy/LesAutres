/** Delivery options. Fees in cents incl. VAT; standard carriers are free from FREE_FROM. */
export const FREE_FROM = 5000;
export const STANDARD_FEE = 595;

export const SHIPPING_OPTIONS = [
  { id: "bpost", label: "bpost", note: "1–3 werkdagen in België" },
  { id: "gls", label: "GLS", note: "2–4 werkdagen" },
  { id: "ups", label: "UPS", note: "1–3 werkdagen" },
  { id: "ceo", label: "Geleverd door de CEO", note: "Persoonlijk aan je deur. Ja, echt.", fee: 50000 },
] as const;

export type ShippingId = (typeof SHIPPING_OPTIONS)[number]["id"];

export const isShippingId = (v: unknown): v is ShippingId =>
  SHIPPING_OPTIONS.some((o) => o.id === v);

export function shippingFee(id: ShippingId, subtotal: number) {
  const o = SHIPPING_OPTIONS.find((x) => x.id === id)!;
  if ("fee" in o) return o.fee;
  return subtotal >= FREE_FROM ? 0 : STANDARD_FEE;
}

export const shippingLabel = (id: string | undefined) =>
  SHIPPING_OPTIONS.find((o) => o.id === id)?.label ?? "Standaard";
