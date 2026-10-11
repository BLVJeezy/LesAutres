import { NextResponse } from "next/server";
import { cartDiscount } from "@/lib/bundles";
import { checkCart, parseCart, parseCustomer } from "@/lib/checkout";
import { isCartId } from "@/lib/drop";
import { firebaseConfigured } from "@/lib/firebase";
import { revolutConfigured } from "@/lib/revolut";
import { encodeLines, startCheckout } from "@/lib/shop";

/**
 * Express checkout (Revolut Pay, Apple Pay, Google Pay): the customer fills in e-mail, phone and
 * shipping address on our page first; the order is only created with complete details.
 */
export async function POST(request: Request) {
  if (!revolutConfigured() || !firebaseConfigured())
    return NextResponse.json({ error: "Betalen is nog niet actief." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const cart = parseCart(body?.cart);
  if (!cart) return NextResponse.json({ error: "Je winkelmand is ongeldig." }, { status: 400 });
  const who = parseCustomer(body?.customer);
  if (!who)
    return NextResponse.json(
      { error: "Vul eerst je naam, e-mailadres, telefoonnummer en volledige verzendadres in." },
      { status: 400 },
    );
  try {
    const cartId = isCartId(body?.cartId) ? body.cartId : undefined;
    const checked = await checkCart(cart, cartId);
    if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 409 });
    const { products } = checked;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || new URL(request.url).origin;
    const { id, token } = await startCheckout({
      lines: encodeLines(cart, products),
      ...who,
      shippingMethod: "bpost",
      cartId,
      discount: cartDiscount(cart, (pid) => products.find((p) => p.id === pid)?.price ?? 0),
      description: cart
        .map((c) => `${products.find((p) => p.id === c.productId)!.name} — maat ${c.size} × ${c.quantity}`)
        .join(" · "),
      origin,
    });
    if (!token) throw new Error("Revolut gaf geen order-token terug.");
    return NextResponse.json({ orderId: id, publicId: token });
  } catch (error) {
    console.error("Express checkout failed", error);
    return NextResponse.json({ error: "Afrekenen lukt nu niet. Probeer het zo meteen opnieuw." }, { status: 502 });
  }
}
