import { NextResponse } from "next/server";
import { setMissingAddress } from "@/lib/shop";

const COUNTRIES = ["BE", "NL", "LU", "FR", "DE", "ES"];
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Shipping address for a paid express-checkout order that has none yet. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const orderId = text(b?.orderId, 64);
  const name = text(b?.name, 120);
  const street = text(b?.street, 200);
  const postcode = text(b?.postcode, 12);
  const city = text(b?.city, 80);
  const country = text(b?.country, 2).toUpperCase();
  const phone = text(b?.phone, 30);
  if (!orderId || phone.replace(/\D/g, "").length < 8 || name.length < 2 || street.length < 3 || postcode.length < 3 || city.length < 2 || !COUNTRIES.includes(country))
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const ok = await setMissingAddress(orderId, { name, phone, address: `${street}, ${postcode} ${city}, ${country}` });
    return NextResponse.json({ ok }, { status: ok ? 200 : 409 });
  } catch (error) {
    console.error("Saving address failed", error);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}
