/** Carriers we ship with and their public track & trace pages. */
export const CARRIERS = [
  { id: "bpost", label: "bpost" },
  { id: "gls", label: "GLS" },
  { id: "ups", label: "UPS" },
  { id: "hand", label: "Persoonlijk (CEO / Issa)" },
] as const;
export type CarrierId = (typeof CARRIERS)[number]["id"];

export const isCarrier = (v: unknown): v is CarrierId => CARRIERS.some((c) => c.id === v);
export const carrierLabel = (id: string | undefined) => CARRIERS.find((c) => c.id === id)?.label ?? "";

/** Builds the tracking link; a pasted https link is used as-is. */
export function trackingUrl(carrier: CarrierId, code: string): string | null {
  const c = code.trim();
  if (/^https:\/\/\S+$/.test(c)) return c;
  if (!c) return null;
  const q = encodeURIComponent(c);
  switch (carrier) {
    case "bpost":
      return `https://track.bpost.cloud/btr/web/#/search?itemCode=${q}&lang=nl`;
    case "gls":
      return `https://gls-group.com/BE/nl/pakket-volgen?match=${q}`;
    case "ups":
      return `https://www.ups.com/track?loc=nl_BE&tracknum=${q}`;
    default:
      return null;
  }
}

/** Default carrier for an order's chosen delivery option. */
export const carrierForShipping = (method: string): CarrierId =>
  method === "gls" || method === "ups" ? method : method === "ceo" || method === "issa" ? "hand" : "bpost";
