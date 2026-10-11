import { NextResponse } from "next/server";
import { firebaseConfigured } from "@/lib/firebase";
import { revolutConfigured } from "@/lib/revolut";
import { cartDiscount } from "@/lib/bundles";
import { isCartId } from "@/lib/drop";
import { checkCart, parseCart } from "@/lib/checkout";
import { isShippingId } from "@/lib/shipping";
import { encodeLines, startCheckout, type Checkout } from "@/lib/shop";

const SHIPPING_COUNTRIES = ["BE", "NL", "LU", "FR", "DE", "ES"];

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const DIAL: Record<string, string> = { BE: "32", NL: "31", LU: "352", FR: "33", DE: "49", ES: "34" };
/** Phone in international E.164 form (+32470123456), as Revolut requires; null when it can't be made valid. */
function e164(raw: string, country: string): string | null {
  let p = raw.replace(/[\s().-]/g, "");
  if (!p) return null;
  if (p.startsWith("00")) p = `+${p.slice(2)}`;
  else if (!p.startsWith("+")) p = `+${DIAL[country] ?? "32"}${p.replace(/^0/, "")}`;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

function parseCustomer(input: unknown): Pick<Checkout, "customer" | "shipping"> | null {
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
    !SHIPPING_COUNTRIES.includes(country)
  )
    return null;
  return {
    customer: { email, full_name: name, ...(e164(phone, country) && { phone: e164(phone, country)! }) },
    shipping: {
      street_line_1: street,
      ...(street2 && { street_line_2: street2 }),
      postcode,
      city,
      country_code: country,
    },
  };
}

export async function POST(request: Request) {
  if (!revolutConfigured() || !firebaseConfigured()) {
    return NextResponse.json(
      { error: "Betalen is nog niet actief. Probeer het later opnieuw." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const cart = parseCart(body?.cart);
  if (!cart) {
    return NextResponse.json({ error: "Je winkelmand is ongeldig." }, { status: 400 });
  }
  const shippingMethod = body?.shippingMethod ?? "bpost";
  if (!isShippingId(shippingMethod)) {
    return NextResponse.json({ error: "Kies een geldige verzendmethode." }, { status: 400 });
  }
  const who = parseCustomer(body?.customer);
  if (!who) {
    return NextResponse.json(
      { error: "Vul je naam, e-mailadres en volledige verzendadres correct in." },
      { status: 400 },
    );
  }

  try {
    const cartId = isCartId(body?.cartId) ? body.cartId : undefined;
    const checked = await checkCart(cart, cartId);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 409 });
    const { products } = checked;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || new URL(request.url).origin;
    const description = cart
      .map((c) => `${products.find((p) => p.id === c.productId)!.name} — maat ${c.size} × ${c.quantity}`)
      .join(" · ");
    const { url } = await startCheckout({
      lines: encodeLines(cart, products),
      ...who,
      shippingMethod,
      cartId,
      discount: cartDiscount(cart, (id) => products.find((p) => p.id === id)?.price ?? 0),
      description,
      origin,
    });
    if (!url) throw new Error("Revolut gaf geen betaalpagina terug.");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Revolut checkout failed", error);
    return NextResponse.json(
      { error: "Afrekenen lukt nu niet. Probeer het zo meteen opnieuw." },
      { status: 502 },
    );
  }
}
