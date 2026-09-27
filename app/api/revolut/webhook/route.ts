import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validRevolutSignature } from "@/lib/revolut";
import { getSetting } from "@/lib/settings";
import { confirmByPaymentId, confirmOrder } from "@/lib/shop";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = (await getSetting("revolutWebhookSecret")) ?? process.env.REVOLUT_WEBHOOK_SECRET;
  if (
    secret &&
    !validRevolutSignature(
      raw,
      request.headers.get("revolut-request-timestamp"),
      request.headers.get("revolut-signature"),
      secret,
    )
  )
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: { event?: string; order_id?: string; merchant_order_ext_ref?: string };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (event.event !== "ORDER_COMPLETED" && event.event !== "ORDER_AUTHORISED")
    return NextResponse.json({ received: true });

  // The payload is only a hint: confirmOrder re-reads the order from the Revolut API before marking it paid.
  try {
    const ok = event.merchant_order_ext_ref
      ? await confirmOrder(event.merchant_order_ext_ref)
      : event.order_id
        ? await confirmByPaymentId(event.order_id)
        : false;
    if (ok) revalidatePath("/");
  } catch (error) {
    console.error("Revolut webhook failed", error);
    return NextResponse.json({ error: "Retry" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
