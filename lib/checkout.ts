import { MAX_CART_LINES, sizes, type CartItem, type ShopProduct } from "./catalog";
import { BUNDLE_PRODUCTS, withUnlimitedStock } from "./bundles";
import { DROP_LIMIT, dropStatus } from "./drop";
import { listProducts, type Checkout } from "./shop";

export function parseCart(input: unknown): CartItem[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CART_LINES)
    return null;
  const cart: CartItem[] = [];
  for (const raw of input) {
    const item = raw as Partial<CartItem>;
    if (
      typeof item.productId !== "string" ||
      !sizes.includes(item.size as CartItem["size"]) ||
      !Number.isInteger(item.quantity) ||
      (item.quantity as number) <= 0 ||
      cart.some((c) => c.productId === item.productId && c.size === item.size)
    )
      return null;
    cart.push({
      productId: item.productId,
      size: item.size as CartItem["size"],
      quantity: item.quantity as number,
    });
  }
  return cart;
}

/** Checks drop availability and stock for a cart; returns the live products or a customer-facing error. */
export async function checkCart(
  cart: CartItem[],
  cartId: string | undefined,
): Promise<{ products: ShopProduct[] } | { error: string }> {
  const products = (await listProducts()).map(withUnlimitedStock);
  const dropQty = cart.filter((c) => BUNDLE_PRODUCTS.includes(c.productId)).reduce((n, c) => n + c.quantity, 0);
  if (dropQty > 0) {
    const { remaining } = await dropStatus(cartId);
    if (dropQty > remaining)
      return {
        error: remaining
          ? `Er zijn nog maar ${remaining} van de ${DROP_LIMIT} tees beschikbaar. Pas je winkelmand aan.`
          : "Drop 001 is uitverkocht.",
      };
  }
  for (const item of cart) {
    const p = products.find((x) => x.id === item.productId);
    if (!p || p.price <= 0 || p.stock[item.size] < item.quantity)
      return {
        error: p
          ? `${p.name} in maat ${item.size} is niet meer (voldoende) op voorraad.`
          : "Een product in je winkelmand is niet meer beschikbaar.",
      };
  }
  return { products };
}

const SHIPPING_COUNTRIES = ["BE", "NL", "LU", "FR", "DE", "ES"];

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const DIAL: Record<string, string> = { BE: "32", NL: "31", LU: "352", FR: "33", DE: "49", ES: "34" };
/** Phone in international E.164 form (+32470123456), as Revolut requires; null when it can't be made valid. */
export function e164(raw: string, country: string): string | null {
  let p = raw.replace(/[\s().-]/g, "");
  if (!p) return null;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  else if (!p.startsWith("+")) p = `+${DIAL[country] ?? "32"}${p.replace(/^0/, "")}`;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

export function parseCustomer(input: unknown): Pick<Checkout, "customer" | "shipping"> | null {
  const c = (input ?? {}) as Record<string, unknown>;
  const email = text(c.email, 254).toLowerCase();
  const name = text(c.name, 120);
  const phone = text(c.phone, 30);
  const street = text(c.street, 200);
  const street2 = text(c.street2, 200);
  const postcode = text(c.postcode, 12);
  const city = text(c.city, 80);
  const country = text(c.country, 2).toUpperCase();
  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    name.length < 2 ||
    street.length < 3 ||
    postcode.length < 3 ||
    city.length < 2 ||
    !SHIPPING_COUNTRIES.includes(country) ||
    !e164(phone, country)
  )
    return null;
  return {
    customer: { email, full_name: name, phone: e164(phone, country)! },
    shipping: {
      street_line_1: street,
      ...(street2 && { street_line_2: street2 }),
      postcode,
      city,
      country_code: country,
    },
  };
}

