import { NextResponse } from "next/server";
import { recordWithdrawal } from "@/lib/withdrawals";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const w = {
    name: text(body?.name, 120),
    email: text(body?.email, 254).toLowerCase(),
    orderNumber: text(body?.orderNumber, 40),
    items: text(body?.items, 1000),
  };
  if (w.name.length < 2 || !/^\S+@\S+\.\S+$/.test(w.email) || w.orderNumber.length < 2)
    return NextResponse.json({ error: "Vul je naam, e-mailadres en bestelnummer in." }, { status: 400 });
  try {
    const r = await recordWithdrawal(w);
    if (!r.stored && !r.mailed)
      return NextResponse.json(
        { error: "Je herroeping kon niet verwerkt worden. Mail ons, dan regelen we het meteen." },
        { status: 503 },
      );
    return NextResponse.json(r);
  } catch (error) {
    console.error("Withdrawal failed", error);
    return NextResponse.json(
      { error: "Je herroeping kon niet verwerkt worden. Probeer opnieuw of mail ons." },
      { status: 502 },
    );
  }
}
