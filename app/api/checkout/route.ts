import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { MAX_CART_LINES, sizes, type CartItem } from "@/lib/catalog";
import { encodeLines, listProducts, SHOP_TAG, stripe } from "@/lib/shop";

const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["BE", "NL", "LU", "FR", "DE", "ES"];

function parseCart(input: unknown): CartItem[] | null {
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

export async function POST(request: Request) {
  const s = stripe();
  if (!s) {
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

  try {
    const products = await listProducts();
    for (const item of cart) {
      const p = products.find((x) => x.id === item.productId);
      if (!p || p.price <= 0 || p.stock[item.size] < item.quantity) {
        return NextResponse.json(
          {
            error: p
              ? `${p.name} in maat ${item.size} is niet meer (voldoende) op voorraad.`
              : "Een product in je winkelmand is niet meer beschikbaar.",
          },
          { status: 409 },
        );
      }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const lines = JSON.stringify(encodeLines(cart, products));
    if (lines.length > 500) {
      return NextResponse.json(
        { error: "Te veel verschillende artikelen in één bestelling." },
        { status: 400 },
      );
    }
    const sizeSummary = cart
      .map((c) => `${products.find((p) => p.id === c.productId)!.name} — maat ${c.size} × ${c.quantity}`)
      .join(" · ");

    const session = await s.checkout.sessions.create({
      mode: "payment",
      locale: "nl",
      line_items: cart.map((item) => {
        const p = products.find((x) => x.id === item.productId)!;
        return {
          quantity: item.quantity,
          price_data: {
            currency: "eur",
            unit_amount: p.price,
            product_data: {
              name: `${p.name} — maat ${item.size}`,
              ...(p.image.startsWith("https://") ? { images: [p.image] } : {}),
              metadata: { shop_line: "1", product_id: p.id, size: item.size },
            },
          },
        };
      }),
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      custom_text: { submit: { message: sizeSummary.slice(0, 1200) } },
      metadata: { shop: SHOP_TAG, lines },
      payment_intent_data: { metadata: { shop: SHOP_TAG } },
      success_url: `${origin}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#drop`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout failed", error);
    return NextResponse.json(
      { error: "Afrekenen lukt nu niet. Probeer het zo meteen opnieuw." },
      { status: 502 },
    );
  }
}
