import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { firestore } from "@/lib/firebase";
import {
  adjustStock,
  decodeLines,
  recordPaidSession,
  refreshOrderByPaymentIntent,
  SHOP_TAG,
  stripe,
} from "@/lib/shop";

export async function POST(request: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!s || !secret || !signature)
    return NextResponse.json({ error: "Not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.metadata?.shop !== SHOP_TAG || session.payment_status !== "paid")
      return NextResponse.json({ received: true });

    if (firestore()) {
      // The order document doubles as the idempotency marker: stock only drops the first time.
      if (await recordPaidSession(session.id)) {
        await adjustStock(decodeLines(session.metadata?.lines), -1);
        revalidatePath("/");
      }
      return NextResponse.json({ received: true });
    }

    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!piId) return NextResponse.json({ received: true });
    const pi = await s.paymentIntents.retrieve(piId);
    if (pi.metadata.stock_applied) return NextResponse.json({ received: true });
    await s.paymentIntents.update(piId, { metadata: { stock_applied: "1" } });
    await adjustStock(decodeLines(session.metadata?.lines), -1);
    revalidatePath("/");
  }

  if (event.type === "charge.refunded") {
    const pi = event.data.object.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (piId) await refreshOrderByPaymentIntent(piId);
  }

  return NextResponse.json({ received: true });
}
