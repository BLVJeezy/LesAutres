import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  availability,
  colors,
  price,
  sizes,
  type CartItem,
} from "@/lib/catalog";

const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["BE", "NL", "LU", "FR", "DE", "ES"];

function validCart(input: unknown): CartItem[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 20)
    return null;
  const cart: CartItem[] = [];
  for (const raw of input) {
    const item = raw as Partial<CartItem>;
    if (
      typeof item.color !== "string" ||
      !colors.some((c) => c.id === item.color) ||
      !sizes.includes(item.size as CartItem["size"]) ||
      !Number.isInteger(item.quantity) ||
      (item.quantity as number) <= 0
    )
      return null;
    const stock = availability(item.color, item.size as CartItem["size"]);
    if (stock.kind === "soldout" || (item.quantity as number) > stock.quantity)
      return null;
    cart.push(item as CartItem);
  }
  return cart;
}

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Betalen is nog niet actief. Probeer het later opnieuw." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const cart = validCart(body?.cart);
  if (!cart) {
    return NextResponse.json(
      { error: "Je winkelmand is ongeldig of niet meer op voorraad." },
      { status: 400 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const stripe = new Stripe(key);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "nl",
      line_items: cart.map((item) => {
        const color = colors.find((c) => c.id === item.color)!;
        const preorder = availability(item.color, item.size).kind === "preorder";
        return {
          quantity: item.quantity,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `The Baddies Tee — ${item.size}${preorder ? " (pre-order)" : ""}`,
              description: color.name,
              metadata: { color: item.color, size: item.size },
            },
          },
        };
      }),
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      metadata: {
        cart: JSON.stringify(cart.map((c) => [c.color, c.size, c.quantity])),
      },
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
