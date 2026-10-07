import { NextResponse } from "next/server";
import { dropStatus, isCartId, reserve } from "@/lib/drop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cartId = new URL(request.url).searchParams.get("cart") ?? undefined;
  try {
    return NextResponse.json(await dropStatus(isCartId(cartId) ? cartId : undefined), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("Drop status failed", error);
    return NextResponse.json({ error: "Niet beschikbaar" }, { status: 502 });
  }
}

/** Reserve the tees in a bag for 10 minutes: { cartId, qty }. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const qty = Number(body?.qty);
  if (!isCartId(body?.cartId) || !Number.isInteger(qty) || qty < 0 || qty > 100)
    return NextResponse.json({ error: "Ongeldig verzoek." }, { status: 400 });
  try {
    const r = await reserve(body.cartId, qty);
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  } catch (error) {
    console.error("Reservation failed", error);
    return NextResponse.json({ error: "Reserveren lukt nu niet." }, { status: 502 });
  }
}
